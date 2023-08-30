defmodule Flirtual.RevenueCat do
  use Flirtual.Logger, :revenuecat

  alias Flirtual.Plan
  alias Flirtual.Repo
  alias Flirtual.User
  alias Flirtual.Subscription

  import Ecto.Changeset

  defp config(key) do
    Application.get_env(:flirtual, Flirtual.RevenueCatController)[key]
  end

  def new_url(pathname, query) do
    URI.parse("https://api.revenuecat.com/v1/" <> pathname)
    |> then(&if(is_nil(query), do: &1, else: Map.put(&1, :query, URI.encode_query(query))))
    |> URI.to_string()
  end

  def fetch(method, pathname, body \\ nil, options \\ []) do
    raw_body = if(is_nil(body), do: "", else: Poison.encode!(body))
    url = new_url(pathname, Keyword.get(options, :query))

    log(:info, [method, url], body)

    HTTPoison.request(method, url, raw_body, [
      {"authorization", "Bearer " <> config(:access_token)},
      {"content-type", "application/json"}
    ])
  end

  def handle_event(
        %{
          "event" => %{
            "type" => type,
            "product_id" => product_id,
            "app_user_id" => customer_id,
            "store" => platform,
            "id" => event_id
          }
        }
      )
      when type in ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "NON_RENEWING_PURCHASE"] do
    with %User{} = user <- User.get(revenuecat_id: customer_id) |> IO.inspect(),
         %Plan{} = plan <- Plan.get(revenuecat_id: product_id) |> IO.inspect(),
         {:ok, subscription} <- Subscription.apply(:revenuecat, user, plan, platform, event_id) |> IO.inspect() do
      log(:info, [type, event_id], subscription)
      :ok
    end
  end

  def handle_event(
        %{
          "event" => %{
            "type" => "PRODUCT_CHANGE",
            "new_product_id" => product_id,
            "app_user_id" => customer_id,
            "store" => platform,
            "id" => event_id
          }
        }
      ) do
    with %User{} = user <- User.get(revenuecat_id: customer_id) |> IO.inspect(),
         %Plan{} = plan <- Plan.get(revenuecat_id: product_id) |> IO.inspect(),
         {:ok, subscription} <- Subscription.apply(:revenuecat, user, plan, platform, event_id) |> IO.inspect() do
      log(:info, ["PRODUCT_CHANGE", event_id], subscription)
      :ok
    end
  end

  def handle_event(%{
        "event" => %{
          "type" => "EXPIRATION",
          "app_user_id" => customer_id
        }
      }) do
    with %User{} = user <- User.get(revenuecat_id: customer_id),
         {:ok, _} <-
           Subscription.cancel(user.subscription) do
      :ok
    end
  end

  def handle_event(event) do
    IO.inspect(event)
    :ok
  end

  def delete(%User{
        revenuecat_id: nil
      }) do
    :ok
  end

  def delete(%User{
        revenuecat_id: revenuecat_id
      }) do
    with {:ok, %HTTPoison.Response{status_code: 200}} <-
           fetch(:delete, "subscribers/#{revenuecat_id}") do
      :ok
    else
      {:error, %HTTPoison.Response{status_code: 404}} -> :ok
    end
  end
end

defmodule Flirtual.RevenueCat do
  use Flirtual.Logger, :revenuecat

  alias Flirtual.{Plan, Subscription, User}

  defp config(key) do
    Application.get_env(:flirtual, FlirtualWeb.RevenueCatController)[key]
  end

  def new_url(pathname, query) do
    URI.parse("https://api.revenuecat.com/v1/" <> pathname)
    |> then(&if(is_nil(query), do: &1, else: Map.put(&1, :query, URI.encode_query(query))))
    |> URI.to_string()
  end

  def fetch(method, pathname, body \\ nil, options \\ [], key \\ :private, platform \\ nil) do
    raw_body = if(is_nil(body), do: "", else: Poison.encode!(body))
    url = new_url(pathname, Keyword.get(options, :query))

    headers = [
      {"authorization",
       "Bearer " <>
         config(
           case {key, platform} do
             {:private, _} -> :api_key
             {:public, "ios"} -> :apple_key
             {:public, "android"} -> :google_key
           end
         )},
      {"content-type", "application/json"}
    ]

    headers =
      if platform do
        [{"x-platform", platform} | headers]
      else
        headers
      end

    log(:debug, [method, url], body)

    HTTPoison.request(method, url, raw_body, headers)
  end

  def handle_event(%{
        "event" => %{
          "type" => type,
          "product_id" => product_id,
          "app_user_id" => customer_id,
          "store" => platform,
          "id" => event_id
        }
      })
      when type in ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "NON_RENEWING_PURCHASE"] do
    with %User{} = user <- User.get(revenuecat_id: customer_id),
         %Plan{} = plan <- Plan.get(revenuecat_id: product_id),
         {:ok, subscription} <-
           Subscription.apply(:revenuecat, user, plan, platform, event_id) do
      log(:debug, [type, event_id], subscription)
      :ok
    end
  end

  def handle_event(%{
        "event" => %{
          "type" => "PRODUCT_CHANGE",
          "new_product_id" => product_id,
          "app_user_id" => customer_id,
          "store" => platform,
          "id" => event_id
        }
      }) do
    with %User{} = user <- User.get(revenuecat_id: customer_id),
         %Plan{} = plan <- Plan.get(revenuecat_id: product_id),
         {:ok, subscription} <-
           Subscription.apply(:revenuecat, user, plan, platform, event_id) do
      log(:debug, ["PRODUCT_CHANGE", event_id], subscription)
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

  def handle_event(_) do
    {:unhandled, :ignored}
  end

  def delete_customer(%User{
        revenuecat_id: nil
      }) do
    :ok
  end

  def delete_customer(%User{
        revenuecat_id: revenuecat_id
      }) do
    with {:ok, %HTTPoison.Response{status_code: 200}} <-
           fetch(:delete, "subscribers/#{revenuecat_id}") do
      :ok
    else
      {:ok, %HTTPoison.Response{status_code: 404}} -> :ok
    end
  end

  def transfer_purchase(
        %User{revenuecat_id: revenuecat_id},
        %Plan{apple_id: apple_id, google_id: google_id},
        platform,
        receipt
      ) do
    with {:ok, %HTTPoison.Response{status_code: 200}} <-
           fetch(
             :post,
             "receipts",
             %{
               "app_user_id" => revenuecat_id,
               "fetch_token" => receipt,
               "product_id" =>
                 case platform do
                   "ios" -> apple_id
                   "android" -> google_id
                 end
             },
             [],
             :public,
             platform
           ) do
      :ok
    end
  end
end

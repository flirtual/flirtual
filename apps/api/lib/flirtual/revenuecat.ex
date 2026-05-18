defmodule Flirtual.RevenueCat do
  use Flirtual.Logger, :revenuecat

  alias Flirtual.{Discord, Plan, Subscription, User}

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
          "id" => event_id,
          "purchased_at_ms" => purchased_at_ms,
          "event_timestamp_ms" => event_timestamp_ms
        }
      })
      when type in ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "NON_RENEWING_PURCHASE"] do
    timestamp_ms =
      if type == "UNCANCELLATION", do: event_timestamp_ms, else: purchased_at_ms

    case resolve_user(customer_id) do
      %User{} = user ->
        with :ok <- check_stale(user.subscription, timestamp_ms),
             %Plan{} = plan <- Plan.get(revenuecat_id: product_id),
             {:ok, subscription} <-
               Subscription.apply(:revenuecat, user, plan, platform, event_id) do
          log(:debug, [type, event_id], subscription)
          :ok
        end

      other ->
        other
    end
  end

  def handle_event(%{
        "event" => %{
          "type" => "PRODUCT_CHANGE",
          "new_product_id" => product_id,
          "app_user_id" => customer_id,
          "store" => platform,
          "id" => event_id,
          "purchased_at_ms" => purchased_at_ms
        }
      }) do
    case resolve_user(customer_id) do
      %User{} = user ->
        with :ok <- check_stale(user.subscription, purchased_at_ms),
             %Plan{} = plan <- Plan.get(revenuecat_id: product_id),
             {:ok, subscription} <-
               Subscription.apply(:revenuecat, user, plan, platform, event_id) do
          log(:debug, ["PRODUCT_CHANGE", event_id], subscription)
          :ok
        end

      other ->
        other
    end
  end

  def handle_event(%{
        "event" => %{
          "type" => "EXPIRATION",
          "app_user_id" => customer_id
        }
      }) do
    case resolve_user(customer_id) do
      %User{} = user ->
        with {:ok, _} <- Subscription.cancel(user.subscription) do
          :ok
        end

      other ->
        other
    end
  end

  def handle_event(%{
        "event" =>
          %{
            "type" => "TRANSFER"
          } = event
      }) do
    from_id = event |> Map.get("transferred_from", []) |> List.first()
    to_id = event |> Map.get("transferred_to", []) |> List.first()
    store = Map.get(event, "store")

    with :ok <-
           Discord.deliver_webhook(:subscription_transferred,
             from_user: if(from_id, do: User.get(revenuecat_id: from_id)),
             from_revenuecat_id: from_id,
             to_user: if(to_id, do: User.get(revenuecat_id: to_id)),
             to_revenuecat_id: to_id,
             store: store
           ) do
      :ok
    end
  end

  def handle_event(_) do
    {:unhandled, :ignored}
  end

  def anonymous_id?(app_user_id) when is_binary(app_user_id),
    do: String.starts_with?(app_user_id, "$RCAnonymousID:")

  def anonymous_id?(_), do: false

  # If we receive an anonymous webhook from an S2S notification, try to resolve the user from
  # RevenueCat's API. It may take a few retries before RevenueCat aliases the user, so we send
  # failures to Oban.
  defp resolve_user(app_user_id) when is_binary(app_user_id) do
    if anonymous_id?(app_user_id) do
      case resolve_aliases(app_user_id) do
        %User{} = user -> user
        nil -> {:retry, :user_not_found}
      end
    else
      case User.get(revenuecat_id: app_user_id) do
        %User{} = user -> user
        nil -> {:unhandled, :unknown_user}
      end
    end
  end

  defp resolve_user(_), do: {:unhandled, :unknown_user}

  defp resolve_aliases(app_user_id) do
    with {:ok, %HTTPoison.Response{status_code: 200, body: body}} <-
           fetch(:get, "subscribers/#{URI.encode_www_form(app_user_id)}"),
         {:ok, %{"subscriber" => %{"original_app_user_id" => original_id}}}
         when is_binary(original_id) <- Poison.decode(body),
         false <- anonymous_id?(original_id) do
      safe_user_lookup(original_id)
    else
      _ -> nil
    end
  end

  defp safe_user_lookup(id) do
    User.get(revenuecat_id: id)
  rescue
    Ecto.Query.CastError -> nil
  end

  defp check_stale(%Subscription{cancelled_at: cancelled_at}, purchased_at_ms)
       when not is_nil(cancelled_at) and is_integer(purchased_at_ms) do
    event_time = DateTime.from_unix!(purchased_at_ms, :millisecond)

    if DateTime.compare(cancelled_at, event_time) == :gt do
      {:unhandled, :stale}
    else
      :ok
    end
  end

  defp check_stale(_, _), do: :ok

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

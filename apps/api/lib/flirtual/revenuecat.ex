defmodule Flirtual.RevenueCat do
  use Flirtual.Logger, :revenuecat

  alias Flirtual.{Discord, Plan, Reconciliation, User}
  alias Flirtual.ObanWorkers.Reconcile

  defp config(key) do
    Application.get_env(:flirtual, FlirtualWeb.RevenueCatController)[key]
  end

  def new_url(pathname, query) do
    URI.parse("https://api.revenuecat.com/v1/" <> pathname)
    |> then(&if(is_nil(query), do: &1, else: Map.put(&1, :query, URI.encode_query(query))))
    |> URI.to_string()
  end

  def fetch(method, pathname, body \\ nil, options \\ [], key \\ :private, platform \\ nil) do
    raw_body = if(is_nil(body), do: "", else: Jason.encode!(body))
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

    Req.request(
      method: method,
      url: url,
      body: raw_body,
      headers: headers,
      decode_body: false,
      retry: false,
      finch: Flirtual.Finch
    )
  end

  @purchase_types [
    "INITIAL_PURCHASE",
    "RENEWAL",
    "UNCANCELLATION",
    "NON_RENEWING_PURCHASE",
    "PRODUCT_CHANGE"
  ]

  @reconcile_types [
    "EXPIRATION",
    "CANCELLATION",
    "BILLING_ISSUE",
    "SUBSCRIPTION_PAUSED",
    "SUBSCRIPTION_EXTENDED",
    "REFUND",
    "TEMPORARY_ENTITLEMENT_GRANT"
  ]

  # Events only trigger a reconcile. Only retry for a purchase RevenueCat has not
  # indexed yet.
  def handle_event(%{
        "event" => %{
          "type" => type,
          "app_user_id" => customer_id
        }
      })
      when type in @purchase_types do
    case resolve_user(customer_id) do
      %User{} = user ->
        case entitlement(user) do
          {:ok, :none} -> {:retry, :entitlement_missing}
          {:ok, _} -> reconcile(user)
          {:error, reason} -> {:retry, reason}
        end

      other ->
        other
    end
  end

  def handle_event(%{
        "event" => %{
          "type" => type,
          "app_user_id" => customer_id
        }
      })
      when type in @reconcile_types do
    case resolve_user(customer_id) do
      %User{} = user -> reconcile(user)
      other -> other
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
             from_user: safe_user_lookup(from_id),
             from_revenuecat_id: from_id,
             to_user: safe_user_lookup(to_id),
             to_revenuecat_id: to_id,
             store: store
           ),
         :ok <- transfer_side(from_id) do
      transfer_side(to_id)
    end
  end

  def handle_event(_) do
    {:unhandled, :ignored}
  end

  defp transfer_side(id) do
    case safe_user_lookup(id) do
      %User{} = user -> reconcile(user)
      nil -> :ok
    end
  end

  def anonymous_id?(app_user_id) when is_binary(app_user_id),
    do: String.starts_with?(app_user_id, "$RCAnonymousID:")

  def anonymous_id?(_), do: false

  # If we receive an anonymous webhook from an S2S notification, try to resolve the user from
  # RevenueCat's API.
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
    with {:ok, %Req.Response{status: 200, body: body}} <-
           fetch(:get, "subscribers/#{URI.encode_www_form(app_user_id)}"),
         {:ok, %{"subscriber" => %{"original_app_user_id" => original_id}}}
         when is_binary(original_id) <- Jason.decode(body),
         false <- anonymous_id?(original_id) do
      safe_user_lookup(original_id)
    else
      _ -> nil
    end
  end

  defp safe_user_lookup(id) when is_binary(id) do
    User.get(revenuecat_id: id)
  rescue
    Ecto.Query.CastError -> nil
  end

  defp safe_user_lookup(_), do: nil

  defp reconcile(%User{id: user_id}) do
    case Reconcile.enqueue(user_id) do
      {:ok, _} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  def subscriber(nil), do: {:ok, nil}

  # Fetching a subscriber upserts it: an id RevenueCat has never seen returns 201
  # with no entitlements.
  def subscriber(revenuecat_id) when is_binary(revenuecat_id) do
    case fetch(:get, "subscribers/#{URI.encode_www_form(revenuecat_id)}") do
      {:ok, %Req.Response{status: status, body: body}} when status in 200..299 ->
        case Jason.decode(body) do
          {:ok, %{"subscriber" => subscriber}} -> {:ok, subscriber}
          _ -> {:error, :revenuecat_malformed}
        end

      {:ok, %Req.Response{status: 404}} ->
        {:ok, nil}

      _ ->
        {:error, :revenuecat_unavailable}
    end
  end

  def entitlement(%User{revenuecat_id: revenuecat_id}) do
    with {:ok, subscriber} <- subscriber(revenuecat_id) do
      {:ok, premium_entitlement(subscriber)}
    end
  end

  # One row per (store, kind). A store enforces a single live subscription per
  # customer, but two products can briefly overlap (e.g. Apple keeps an
  # introductory offer active alongside the product it was upgraded to), so the
  # longest-lived one per store wins.
  def rows(%User{revenuecat_id: revenuecat_id}) do
    with {:ok, subscriber} <- subscriber(revenuecat_id) do
      {:ok, subscription_rows(subscriber) ++ one_time_rows(subscriber)}
    end
  end

  defp subscription_rows(nil), do: []

  defp subscription_rows(subscriber) do
    (subscriber["subscriptions"] || %{})
    |> Enum.flat_map(fn {product, subscription} ->
      with store when not is_nil(store) <- store(subscription["store"]),
           %Plan{} = plan <- subscription_plan(product, subscription),
           {:ok, entitled_until} <- subscription_until(subscription) do
        [
          %{
            kind: :subscription,
            store: store,
            plan_id: plan.id,
            entitled_until: entitled_until,
            renews: renewing?(subscription),
            renewal_pending: renewal_pending?(subscription),
            ids: store_ids(subscription)
          }
        ]
      else
        _ ->
          log(:warning, [:rows], "skipping unrecognized subscription: #{product}")
          []
      end
    end)
    |> Enum.group_by(& &1.store)
    |> Enum.map(fn {_store, rows} ->
      Enum.max_by(rows, &DateTime.to_unix(&1.entitled_until))
    end)
  end

  # A refunded purchase disappears from non_subscriptions, so presence means
  # owned.
  defp one_time_rows(nil), do: []

  defp one_time_rows(subscriber) do
    (subscriber["non_subscriptions"] || %{})
    |> Enum.flat_map(fn {product, purchases} ->
      with %{} = purchase <- List.last(purchases || []),
           store when not is_nil(store) <- store(purchase["store"]),
           %Plan{} = plan <- Plan.get(revenuecat_id: product) do
        [
          %{
            kind: :one_time,
            store: store,
            plan_id: plan.id,
            entitled_until: nil,
            renews: nil,
            renewal_pending: nil,
            ids: store_ids(purchase)
          }
        ]
      else
        _ ->
          log(:warning, [:rows], "skipping unrecognized purchase: #{product}")
          []
      end
    end)
    |> Enum.uniq_by(& &1.store)
  end

  defp store("app_store"), do: :app_store
  defp store("mac_app_store"), do: :app_store
  defp store("play_store"), do: :play_store
  defp store(_), do: nil

  # RevenueCat splits a Google Play product into the product and its base plan;
  # joined they are the id stored on the plan. Apple products carry the whole
  # id in the product identifier.
  defp subscription_plan(product, subscription) do
    case subscription["product_plan_identifier"] do
      nil -> Plan.get(revenuecat_id: product)
      base_plan -> Plan.get(revenuecat_id: "#{product}:#{base_plan}")
    end
  end

  # RevenueCat suffixes renewals with "..N"; the base is the Apple original
  # transaction id or the Google Play order id.
  defp store_ids(purchase) do
    case purchase["store_transaction_id"] do
      nil -> [store_id: nil]
      id -> [store_id: id |> String.split("..") |> List.first()]
    end
  end

  defp subscription_until(subscription) do
    with {:ok, expires_at} <- parse_datetime(subscription["expires_date"]) do
      {:ok,
       expires_at
       |> grace_period(subscription["grace_period_expires_date"])
       |> settling(subscription)}
    end
  end

  # RevenueCat opens an anonymous customer for Play purchases it learns about
  # from Google before our SDK reports them, then moves the purchase to the real
  # customer once the SDK claims it. An anonymous customer that still holds
  # premium is unclaimed.
  def unclaimed?(app_user_id) when is_binary(app_user_id) do
    with true <- anonymous_id?(app_user_id),
         {:ok, subscriber} <- subscriber(app_user_id) do
      Reconciliation.entitles_now?(premium_entitlement(subscriber))
    else
      _ -> false
    end
  end

  def unclaimed?(_), do: false

  # A missing expires_date is a lifetime purchase. A billing grace period keeps
  # the user entitled: the store is still retrying their payment.
  defp premium_entitlement(nil), do: :none

  defp premium_entitlement(%{"entitlements" => %{"premium" => premium}} = subscriber) do
    case premium["expires_date"] do
      nil ->
        :perpetual

      expires_date ->
        case parse_datetime(expires_date) do
          {:ok, expires_at} ->
            subscription =
              get_in(subscriber, ["subscriptions", premium["product_identifier"]]) || %{}

            {:until,
             expires_at
             |> grace_period(premium["grace_period_expires_date"])
             |> settling(subscription)}

          :error ->
            :none
        end
    end
  end

  defp premium_entitlement(_), do: :none

  defp grace_period(expires_at, grace_period_expires_date) do
    case parse_datetime(grace_period_expires_date) do
      {:ok, grace_at} -> Reconciliation.latest(expires_at, grace_at)
      :error -> expires_at
    end
  end

  # Grace period to wait for a pending renewal to settle.
  @settling_days 3

  # A renewal Google has not settled leaves the term ended with none of its
  # other signals set: it has neither taken the money nor given up on it. Once
  # it gives up, billing_issues_detected_at lands within ~1 day and this stops
  # applying. Anchored to the term end rather than now, so reconciling
  # repeatedly cannot walk it forward.
  defp settling(until, subscription) do
    if DateTime.after?(until, DateTime.utc_now()) or not quiet?(subscription),
      do: until,
      else: DateTime.add(until, @settling_days, :day)
  end

  # The store still intends to renew it: nobody has unsubscribed and nothing
  # was refunded. A billing issue does not clear this; the store is retrying.
  defp renewing?(%{"unsubscribe_detected_at" => nil, "refunded_at" => nil}), do: true
  defp renewing?(_), do: false

  # Apple and Google give up retrying payment within 60 days.
  @pending_days 60

  # It means to renew but the money has not arrived: the store has raised a
  # billing issue and is retrying, or the term ended with no signal either way.
  defp renewal_pending?(subscription) do
    case parse_datetime(subscription["expires_date"]) do
      {:ok, expires_at} ->
        now = DateTime.utc_now()

        renewing?(subscription) and
          (not is_nil(subscription["billing_issues_detected_at"]) or
             not DateTime.after?(expires_at, now)) and
          DateTime.after?(DateTime.add(expires_at, @pending_days, :day), now)

      :error ->
        false
    end
  end

  # No signals at all: the settling window only applies when the store has not
  # yet told us anything, since a raised billing issue comes with its own grace.
  defp quiet?(%{
         "unsubscribe_detected_at" => nil,
         "billing_issues_detected_at" => nil,
         "refunded_at" => nil
       }),
       do: true

  defp quiet?(_), do: false

  defp parse_datetime(nil), do: :error

  defp parse_datetime(value) do
    case DateTime.from_iso8601(value) do
      {:ok, value, _} -> {:ok, value}
      _ -> :error
    end
  end

  def cancel_subscriptions(%User{revenuecat_id: nil}), do: :ok

  def cancel_subscriptions(%User{revenuecat_id: revenuecat_id}) do
    case subscriber(revenuecat_id) do
      {:ok, subscriber} ->
        subscriber
        |> cancellable_transactions()
        |> Enum.each(&cancel_subscription(revenuecat_id, &1))

        :ok

      {:error, reason} ->
        log(:error, [:cancel_subscriptions, revenuecat_id], reason)
        :ok
    end
  end

  defp cancellable_transactions(%{"subscriptions" => subscriptions})
       when is_map(subscriptions) do
    subscriptions
    |> Map.values()
    |> Enum.filter(
      &(&1["store"] == "play_store" and is_nil(&1["unsubscribe_detected_at"]) and
          is_nil(&1["refunded_at"]))
    )
    |> Enum.map(& &1["store_transaction_id"])
    |> Enum.reject(&is_nil/1)
  end

  defp cancellable_transactions(_), do: []

  defp cancel_subscription(revenuecat_id, store_transaction_id) do
    path =
      "subscribers/#{URI.encode_www_form(revenuecat_id)}/subscriptions/#{URI.encode_www_form(store_transaction_id)}/cancel"

    case fetch(:post, path) do
      {:ok, %Req.Response{status: status}} when status in 200..299 ->
        :ok

      other ->
        log(:error, [:cancel_subscription, store_transaction_id], other)
        :ok
    end
  end

  def delete_customer(%User{
        revenuecat_id: nil
      }) do
    :ok
  end

  def delete_customer(%User{
        revenuecat_id: revenuecat_id
      }) do
    with {:ok, %Req.Response{status: 200}} <-
           fetch(:delete, "subscribers/#{revenuecat_id}") do
      :ok
    else
      {:ok, %Req.Response{status: 404}} -> :ok
    end
  end

  def transfer_purchase(
        %User{revenuecat_id: revenuecat_id},
        %Plan{apple_id: apple_id, google_id: google_id},
        platform,
        receipt
      ) do
    with {:ok, %Req.Response{status: 200}} <-
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

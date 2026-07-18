defmodule Flirtual.Chargebee do
  use Flirtual.Logger, :chargebee

  alias Flirtual.{Entitlement, Plan, Repo, User}
  alias Flirtual.ObanWorkers.Reconcile

  import Ecto.Changeset

  # The statuses in which Chargebee still grants the customer access.
  @active_statuses ["active", "non_renewing"]

  # What the user holds here, one row per (store, kind). Our checkout reuses a
  # customer's existing subscription (replace_item_list), so a customer has at
  # most one live subscription; if several ever appear, the longest-lived wins.
  # A lifetime is keyed on its transaction rather than the customer, and only a
  # refund revokes it.
  def rows(%User{} = user) do
    one_time = Entitlement.get(user_id: user.id, store: :chargebee, kind: :one_time)

    with {:ok, subscriptions} <- subscription_rows(user.chargebee_id),
         {:ok, one_times} <- one_time_rows(one_time) do
      {:ok, subscriptions ++ one_times}
    end
  end

  defp subscription_rows(nil), do: {:ok, []}

  defp subscription_rows(customer_id) do
    case Chargebeex.Subscription.list(%{"customer_id[is]" => customer_id}) do
      {:ok, subscriptions, _} ->
        subscriptions
        |> Enum.filter(&(&1.status in @active_statuses))
        |> Enum.sort_by(&(&1.current_term_end || 0), :desc)
        |> Enum.take(1)
        |> Enum.flat_map(&subscription_row/1)
        |> then(&{:ok, &1})

      _ ->
        {:error, :chargebee_unavailable}
    end
  end

  defp subscription_row(subscription) do
    case subscription_plan(subscription) do
      %Plan{} = plan ->
        [
          %{
            kind: :subscription,
            store: :chargebee,
            plan_id: plan.id,
            entitled_until:
              subscription.current_term_end &&
                DateTime.from_unix!(subscription.current_term_end),
            renews: subscription.status == "active",
            renewal_pending: false,
            ids: [store_id: subscription.id]
          }
        ]

      nil ->
        log(:warning, [:rows], "skipping unrecognized subscription: #{subscription.id}")
        []
    end
  end

  defp subscription_plan(subscription) do
    case subscription.subscription_items do
      [%{"item_price_id" => item_price_id} | _] -> Plan.get(chargebee_id: item_price_id)
      _ -> nil
    end
  end

  defp one_time_rows(nil), do: {:ok, []}

  defp one_time_rows(%Entitlement{store_id: store_id} = entitlement)
       when is_binary(store_id) do
    with {:ok, state} <- one_time_state(store_id) do
      case state do
        :perpetual ->
          {:ok,
           [
             %{
               kind: :one_time,
               store: :chargebee,
               plan_id: entitlement.plan_id,
               entitled_until: nil,
               renews: nil,
               renewal_pending: nil,
               ids: [store_id: store_id]
             }
           ]}

        :none ->
          {:ok, []}
      end
    end
  end

  defp one_time_rows(_), do: {:ok, []}

  # Lifetime missing from Chargebee may be a legacy Stripe purchase. We only
  # revoke one-time entitlements with a failed payment or known refund.
  defp one_time_state(store_id) do
    case Chargebeex.Client.get("/transactions/#{store_id}") do
      {:ok, _, _, %{"transaction" => transaction}} ->
        payment_state(transaction)

      {:error, 404, _, _} ->
        {:ok, :perpetual}

      _ ->
        {:error, :chargebee_unavailable}
    end
  end

  @failed_statuses ["failure", "voided", "timeout"]

  defp payment_state(%{"status" => status}) when status in @failed_statuses,
    do: {:ok, :none}

  defp payment_state(%{
         "id" => id,
         "customer_id" => customer_id,
         "amount" => amount
       })
       when is_binary(customer_id) and is_integer(amount) and amount > 0 do
    case refunded_amount(customer_id, id) do
      {:ok, refunded} when refunded > 0 -> {:ok, :none}
      {:ok, _} -> {:ok, :perpetual}
      {:error, reason} -> {:error, reason}
    end
  end

  defp payment_state(_), do: {:ok, :perpetual}

  # Chargebee records refunds as a separate transaction pointing at the original
  # transaction via refunded_txn_id. The original payment status and
  # linked_refunds is not updated. Unknown filters are silently ignored by the
  # API, so refunded_txn_id cannot be filtered on server-side and is matched here
  # instead.
  defp refunded_amount(customer_id, payment_id) do
    case Chargebeex.Client.get("/transactions", %{
           "customer_id[is]" => customer_id,
           "type[is]" => "refund",
           "limit" => 100
         }) do
      {:ok, _, _, %{"list" => list}} ->
        {:ok,
         list
         |> Enum.map(fn %{"transaction" => transaction} -> transaction end)
         |> Enum.filter(
           &(&1["refunded_txn_id"] == payment_id and &1["status"] not in @failed_statuses)
         )
         |> Enum.map(&(&1["amount"] || 0))
         |> Enum.sum()}

      _ ->
        {:error, :chargebee_unavailable}
    end
  end

  # https://www.chargebee.com/docs/billing/2.0/customers/supported-locales
  def to_valid_locale(locale) do
    case locale do
      "ja" -> "en"
      "ko" -> "en"
      "nl" -> "en"
      "ru" -> "en"
      "sv" -> "en"
      _ -> locale
    end
  end

  def checkout(%User{chargebee_id: nil} = user, %Plan{purchasable: true} = plan) do
    with {:ok, customer} <- update_customer(user) do
      Map.put(user, :chargebee_id, customer.id)
      |> checkout(plan)
    end
  end

  def checkout(
        %User{chargebee_id: chargebee_id} = user,
        %Plan{purchasable: true, recurring: true} = plan
      )
      when is_binary(chargebee_id) do
    subscription = Entitlement.get(user_id: user.id, store: :chargebee, kind: :subscription)

    existing =
      Entitlement.active?(subscription) and not is_nil(subscription.store_id)

    manage = existing and subscription.plan_id == plan.id

    allowed = is_nil(user.payments_banned_at) and is_nil(user.indef_shadowbanned_at)

    case {existing, manage, allowed} do
      {true, true, _} ->
        manage(user)

      {_, _, false} ->
        {:error, :payments_banned}

      {true, _, _} ->
        Chargebeex.Action.generic_action_without_id(
          :post,
          "hosted_page",
          "checkout_existing_for_items",
          %{
            layout: "in_app",
            embed: true,
            iframe_messaging: true,
            customer: %{
              id: chargebee_id,
              locale: to_valid_locale(user.preferences.language)
            },
            subscription: %{id: subscription.store_id},
            subscription_items: [
              %{item_price_id: plan.chargebee_id}
            ],
            replace_item_list: true,
            redirect_url:
              Application.fetch_env!(:flirtual, :frontend_origin)
              |> URI.merge("/subscription?success=true")
              |> URI.to_string(),
            cancel_url:
              Application.fetch_env!(:flirtual, :frontend_origin)
              |> URI.merge("/subscription")
              |> URI.to_string()
          }
        )

      {false, _, _} ->
        Chargebeex.Action.generic_action_without_id(
          :post,
          "hosted_page",
          "checkout_new_for_items",
          %{
            layout: "in_app",
            embed: true,
            iframe_messaging: true,
            customer: %{
              id: chargebee_id,
              locale: to_valid_locale(user.preferences.language)
            },
            subscription_items: [
              %{item_price_id: plan.chargebee_id}
            ],
            redirect_url:
              Application.fetch_env!(:flirtual, :frontend_origin)
              |> URI.merge("/subscription?success=true")
              |> URI.to_string(),
            cancel_url:
              Application.fetch_env!(:flirtual, :frontend_origin)
              |> URI.merge("/subscription")
              |> URI.to_string()
          }
        )
    end
  end

  def checkout(
        %User{chargebee_id: chargebee_id} = user,
        %Plan{purchasable: true, recurring: false} = plan
      )
      when is_binary(chargebee_id) do
    allowed = is_nil(user.payments_banned_at) and is_nil(user.indef_shadowbanned_at)

    case allowed do
      true ->
        Chargebeex.Action.generic_action_without_id(
          :post,
          "hosted_page",
          "checkout_one_time_for_items",
          %{
            layout: "in_app",
            embed: true,
            iframe_messaging: true,
            customer: %{
              id: chargebee_id,
              locale: to_valid_locale(user.preferences.language)
            },
            item_prices: [
              %{item_price_id: plan.chargebee_id}
            ],
            currency_code: "usd",
            redirect_url:
              Application.fetch_env!(:flirtual, :frontend_origin)
              |> URI.merge("/subscription?success=true")
              |> URI.to_string(),
            cancel_url:
              Application.fetch_env!(:flirtual, :frontend_origin)
              |> URI.merge("/subscription")
              |> URI.to_string()
          }
        )

      false ->
        {:error, :payments_banned}
    end
  end

  def manage(%User{chargebee_id: nil} = user) do
    with {:ok, customer} <- update_customer(user) do
      Map.put(user, :chargebee_id, customer.id)
      |> manage()
    end
  end

  def manage(%User{chargebee_id: chargebee_id} = user) do
    Chargebeex.PortalSession.create(%{
      customer: %{id: chargebee_id, locale: to_valid_locale(user.preferences.language)}
    })
  end

  # User isn't an existing Chargebee Customer, create one.
  def update_customer(%User{chargebee_id: nil} = user) do
    with {:ok, customer} <-
           Chargebeex.Customer.create(%{
             email: user.email,
             locale: to_valid_locale(user.preferences.language)
           }),
         {:ok, _} <-
           change(user, %{chargebee_id: customer.id})
           |> Repo.update() do
      {:ok, customer}
    end
  end

  # User is an existing Chargebee Customer, update their customer details.
  def update_customer(%User{chargebee_id: chargebee_id} = user) when is_binary(chargebee_id) do
    Chargebeex.Customer.update(chargebee_id, %{
      email: user.email,
      locale: to_valid_locale(user.preferences.language)
    })
  end

  # User isn't an existing Chargebee Customer, do nothing.
  def delete_customer(%User{chargebee_id: nil}), do: {:ok, nil}

  def delete_customer(%User{chargebee_id: chargebee_id}) when is_binary(chargebee_id) do
    case Chargebeex.Customer.delete(chargebee_id) do
      {:ok, customer} -> {:ok, customer}
      {:error, 404, _, _} -> {:ok, nil}
    end
  end

  # Chargebee cannot move a subscription between customers, so the customer
  # moves instead, taking its subscriptions, billing history and payment methods
  # with it. A lifetime is keyed on its transaction rather than on the customer,
  # so it travels with the rows alone.
  def transfer(%User{id: id}, %User{id: id}), do: {:error, :same_user}

  def transfer(%User{} = source, %User{} = target) do
    cond do
      Entitlement.list(user_id: source.id) == [] ->
        {:error, :no_entitlements}

      Entitlement.list(user_id: target.id) != [] ->
        {:error, :target_has_entitlements}

      true ->
        move(source, target)
    end
  end

  defp move(%User{} = source, %User{} = target) do
    Repo.transaction(fn ->
      with {:ok, _} <- source |> change(%{chargebee_id: nil}) |> Repo.update(),
           {:ok, _} <-
             target |> change(%{chargebee_id: source.chargebee_id}) |> Repo.update(),
           {:ok, count} <- Entitlement.reassign(source, target) do
        count
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def get_customer(chargebee_id) when is_binary(chargebee_id) do
    Chargebeex.Customer.retrieve(chargebee_id)
  end

  def get_customer(_), do: {:ok, nil}

  defp event_error(%Chargebeex.Event{} = event, value) do
    log(:error, [event["event_type"], event["id"]], value)
    :error
  end

  @subscription_events [
    "payment_succeeded",
    "subscription_started",
    "subscription_renewed",
    "subscription_changed",
    "subscription_reactivated",
    "subscription_resumed",
    "subscription_cancelled",
    "subscription_deleted",
    "subscription_paused",
    "payment_refunded",
    "refund_initiated"
  ]

  # A lifetime purchase has no subscription object, so the reconcile cannot
  # discover it on its own: the transaction is recorded here, and any live
  # subscription is cancelled since it no longer buys anything.
  def handle_event(
        %{
          "event_type" => "payment_succeeded",
          "content" => %{
            "invoice" => %{
              "line_items" => [
                %{
                  "entity_id" => "lifetime"
                }
              ]
            },
            "transaction" => %{
              "id" => transaction_chargebee_id
            },
            "customer" => %{
              "id" => customer_chargebee_id
            }
          }
        } = event
      ) do
    with %User{} = user <- User.get(chargebee_id: customer_chargebee_id),
         %Plan{} = plan <- Plan.get(chargebee_id: "lifetime"),
         subscription =
           Entitlement.get(user_id: user.id, store: :chargebee, kind: :subscription),
         {:ok, _} <-
           if(
             Entitlement.active?(subscription) and not is_nil(subscription.store_id),
             do:
               Chargebeex.Action.generic_action(
                 :post,
                 "subscription",
                 "cancel_for_items",
                 subscription.store_id
               ),
             else: {:ok, nil}
           ),
         {:ok, entitlement} <-
           Entitlement.record(user, plan, :chargebee, store_id: transaction_chargebee_id) do
      log(:debug, [event["event_type"], event["id"]], entitlement)
      reconcile(user)
    else
      %Plan{} -> :ok
      value -> event_error(event, value)
    end
  end

  # Webhooks may be outdated/inaccurate, so we reconcile with current state.
  def handle_event(%{
        "event_type" => type,
        "content" => %{
          "customer" => %{
            "id" => customer_chargebee_id
          }
        }
      })
      when type in @subscription_events do
    reconcile(User.get(chargebee_id: customer_chargebee_id))
  end

  def handle_event(%{
        "event_type" => type,
        "content" => %{
          "subscription" => %{
            "id" => chargebee_id
          }
        }
      })
      when type in @subscription_events do
    case Entitlement.get(store_id: chargebee_id) do
      %Entitlement{} = entitlement -> reconcile(User.get(entitlement.user_id))
      nil -> :ok
    end
  end

  def handle_event(event) do
    log(:debug, [event["event_type"], event["id"]], event)
    {:unhandled, :ignored}
  end

  defp reconcile(%User{id: user_id}) do
    case Reconcile.enqueue(user_id) do
      {:ok, _} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  defp reconcile(nil), do: :ok
end

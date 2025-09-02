defmodule Flirtual.Chargebee do
  use Flirtual.Logger, :chargebee

  alias Flirtual.{Plan, Repo, Subscription, User}

  import Ecto.Changeset

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
    existing =
      Subscription.active?(user.subscription) and not is_nil(user.subscription.chargebee_id)

    manage = existing and user.subscription.plan_id == plan.id

    allowed = is_nil(user.payments_banned_at) and is_nil(user.indef_shadowbanned_at)

    case {existing, manage, allowed} do
      {true, true, _} ->
        manage(user)

      {_, _, false} ->
        {:error, :payments_banned}

      {true, _, _} ->
        with {:ok,
              %Chargebeex.HostedPage{
                url: url
              }} <-
               Chargebeex.Action.generic_action_without_id(
                 :post,
                 "hosted_page",
                 "checkout_existing_for_items",
                 %{
                   layout: "in_app",
                   customer: %{
                     id: chargebee_id,
                     locale: to_valid_locale(user.preferences.language)
                   },
                   subscription: %{id: user.subscription.chargebee_id},
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
               ) do
          {:ok, url}
        end

      {false, _, _} ->
        with {:ok,
              %Chargebeex.HostedPage{
                url: url
              }} <-
               Chargebeex.Action.generic_action_without_id(
                 :post,
                 "hosted_page",
                 "checkout_new_for_items",
                 %{
                   layout: "in_app",
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
               ) do
          {:ok, url}
        end
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
        with {:ok,
              %Chargebeex.HostedPage{
                url: url
              }} <-
               Chargebeex.Action.generic_action_without_id(
                 :post,
                 "hosted_page",
                 "checkout_one_time_for_items",
                 %{
                   layout: "in_app",
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
               ) do
          {:ok, url}
        end

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
    with {:ok,
          %Chargebeex.PortalSession{
            access_url: url
          }} <-
           Chargebeex.PortalSession.create(%{
             customer: %{id: chargebee_id, locale: to_valid_locale(user.preferences.language)}
           }) do
      {:ok, url}
    end
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

  def get_customer(chargebee_id) when is_binary(chargebee_id) do
    Chargebeex.Customer.retrieve(chargebee_id)
  end

  def get_customer(_), do: {:ok, nil}

  def get_subscription(chargebee_id) when is_binary(chargebee_id) do
    Chargebeex.Subscription.retrieve(chargebee_id)
  end

  def cancel_subscription(%Subscription{chargebee_id: chargebee_id}) do
    subscription = get_subscription(chargebee_id)

    with {:ok, %Chargebeex.Subscription{cancelled_at: nil}} <- subscription,
         {:ok, subscription} <-
           Chargebeex.Action.generic_action(
             :post,
             "subscription",
             "cancel_for_items",
             chargebee_id,
             %{end_of_term: true}
           ) do
      {:ok, subscription}
    else
      {:ok, %Chargebeex.Subscription{} = subscription} -> {:ok, subscription}
      value -> value
    end
  end

  defp event_error(%Chargebeex.Event{} = event, value) do
    log(:error, [event["event_type"], event["id"]], value)
    :error
  end

  def handle_event(
        %{
          "event_type" => "payment_succeeded",
          "content" => %{
            "subscription" => %{
              "id" => subscription_chargebee_id,
              "status" => "active",
              "subscription_items" => [
                %{"item_price_id" => price_chargebee_id}
              ]
            },
            "customer" => %{
              "id" => customer_chargebee_id
            }
          }
        } = event
      ) do
    with %User{} = user <- User.get(chargebee_id: customer_chargebee_id),
         %Plan{} = plan <- Plan.get(chargebee_id: price_chargebee_id),
         {:ok, subscription} <-
           Subscription.apply(:chargebee, user, plan, subscription_chargebee_id) do
      log(:debug, [event["event_type"], event["id"]], subscription)
      :ok
    else
      value -> event_error(event, value)
    end
  end

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
         {:ok, _} <-
           if(
             Subscription.active?(user.subscription) and
               not is_nil(user.subscription.chargebee_id),
             do:
               Chargebeex.Action.generic_action(
                 :post,
                 "subscription",
                 "cancel_for_items",
                 user.subscription.chargebee_id
               ),
             else: {:ok, nil}
           ),
         {:ok, subscription} <-
           Subscription.apply(:chargebee, user, plan, transaction_chargebee_id) do
      log(:debug, [event["event_type"], event["id"]], subscription)
      :ok
    else
      %Plan{} -> :ok
      value -> event_error(event, value)
    end
  end

  def handle_event(
        %{
          "event_type" => type,
          "content" => %{
            "subscription" => %{
              "id" => subscription_chargebee_id,
              "status" => "active",
              "subscription_items" => [
                %{"item_price_id" => price_chargebee_id}
              ]
            },
            "customer" => %{
              "id" => customer_chargebee_id
            }
          }
        } = event
      )
      when type in [
             "subscription_started",
             "subscription_renewed",
             "subscription_changed",
             "subscription_reactivated",
             "subscription_resumed"
           ] do
    with %User{} = user <- User.get(chargebee_id: customer_chargebee_id),
         %Plan{} = plan <- Plan.get(chargebee_id: price_chargebee_id),
         {:ok, subscription} <-
           Subscription.apply(:chargebee, user, plan, subscription_chargebee_id) do
      log(:debug, [event["event_type"], event["id"]], subscription)
      :ok
    else
      value -> event_error(event, value)
    end
  end

  def handle_event(
        %{
          "event_type" => type,
          "content" => %{
            "subscription" => %{
              "id" => chargebee_id
            }
          }
        } = event
      )
      when type in ["subscription_cancelled", "subscription_deleted", "subscription_paused"] do
    with %Subscription{} = subscription <- Subscription.get(chargebee_id: chargebee_id),
         {:ok, _} <- Subscription.cancel(subscription) do
      :ok
    else
      nil -> :ok
      value -> event_error(event, value)
    end
  end

  def handle_event(event) do
    log(:debug, [event["event_type"], event["id"]], event)
    {:unhandled, :ignored}
  end
end

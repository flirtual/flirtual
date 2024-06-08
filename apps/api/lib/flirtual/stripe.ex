defmodule Flirtual.Stripe do
  @behaviour Stripe.WebhookHandler
  use Flirtual.Logger, :stripe

  alias Flirtual.Plan
  alias Flirtual.Repo
  alias Flirtual.Subscription
  alias Flirtual.User

  import Ecto.Changeset

  @shipping_allowed_countries [
    :AC,
    :AD,
    :AE,
    :AF,
    :AG,
    :AI,
    :AL,
    :AM,
    :AO,
    :AQ,
    :AR,
    :AT,
    :AU,
    :AW,
    :AX,
    :AZ,
    :BA,
    :BB,
    :BD,
    :BE,
    :BF,
    :BG,
    :BH,
    :BI,
    :BJ,
    :BL,
    :BM,
    :BN,
    :BO,
    :BQ,
    :BR,
    :BS,
    :BT,
    :BV,
    :BW,
    :BY,
    :BZ,
    :CA,
    :CD,
    :CF,
    :CG,
    :CH,
    :CI,
    :CK,
    :CL,
    :CM,
    :CN,
    :CO,
    :CR,
    :CV,
    :CW,
    :CY,
    :CZ,
    :DE,
    :DJ,
    :DK,
    :DM,
    :DO,
    :DZ,
    :EC,
    :EE,
    :EG,
    :EH,
    :ER,
    :ES,
    :ET,
    :FI,
    :FJ,
    :FK,
    :FO,
    :FR,
    :GA,
    :GB,
    :GD,
    :GE,
    :GF,
    :GG,
    :GH,
    :GI,
    :GL,
    :GM,
    :GN,
    :GP,
    :GQ,
    :GR,
    :GS,
    :GT,
    :GU,
    :GW,
    :GY,
    :HK,
    :HN,
    :HR,
    :HT,
    :HU,
    :ID,
    :IE,
    :IL,
    :IM,
    :IN,
    :IO,
    :IQ,
    :IS,
    :IT,
    :JE,
    :JM,
    :JO,
    :JP,
    :KE,
    :KG,
    :KH,
    :KI,
    :KM,
    :KN,
    :KR,
    :KW,
    :KY,
    :KZ,
    :LA,
    :LB,
    :LC,
    :LI,
    :LK,
    :LR,
    :LS,
    :LT,
    :LU,
    :LV,
    :LY,
    :MA,
    :MC,
    :MD,
    :ME,
    :MF,
    :MG,
    :MK,
    :ML,
    :MM,
    :MN,
    :MO,
    :MQ,
    :MR,
    :MS,
    :MT,
    :MU,
    :MV,
    :MW,
    :MX,
    :MY,
    :MZ,
    :NA,
    :NC,
    :NE,
    :NG,
    :NI,
    :NL,
    :NO,
    :NP,
    :NR,
    :NU,
    :NZ,
    :OM,
    :PA,
    :PE,
    :PF,
    :PG,
    :PH,
    :PK,
    :PL,
    :PM,
    :PN,
    :PR,
    :PS,
    :PT,
    :PY,
    :QA,
    :RE,
    :RO,
    :RS,
    :RU,
    :RW,
    :SA,
    :SB,
    :SC,
    :SE,
    :SG,
    :SH,
    :SI,
    :SJ,
    :SK,
    :SL,
    :SM,
    :SN,
    :SO,
    :SR,
    :SS,
    :ST,
    :SV,
    :SX,
    :SZ,
    :TA,
    :TC,
    :TD,
    :TF,
    :TG,
    :TH,
    :TJ,
    :TK,
    :TL,
    :TM,
    :TN,
    :TO,
    :TR,
    :TT,
    :TV,
    :TW,
    :TZ,
    :UA,
    :UG,
    :US,
    :UY,
    :UZ,
    :VA,
    :VC,
    :VE,
    :VG,
    :VN,
    :VU,
    :WF,
    :WS,
    :XK,
    :YE,
    :YT,
    :ZA,
    :ZM,
    :ZW,
    :ZZ
  ]

  def checkout(%User{stripe_id: nil} = user, %Plan{purchasable: true} = plan) do
    with {:ok, customer} <- update_customer(user) do
      Map.put(user, :stripe_id, customer.id)
      |> checkout(plan)
    end
  end

  def checkout(%User{stripe_id: stripe_id} = user, %Plan{purchasable: true} = plan)
      when is_binary(stripe_id) do
    Stripe.Checkout.Session.create(
      Map.merge(
        %{
          customer: stripe_id,
          client_reference_id: user.id,
          success_url:
            Application.fetch_env!(:flirtual, :frontend_origin)
            |> URI.merge("/subscription?success={CHECKOUT_SESSION_ID}")
            |> URI.to_string(),
          cancel_url:
            Application.fetch_env!(:flirtual, :frontend_origin)
            |> URI.merge("/subscription")
            |> URI.to_string(),
          line_items: [
            %{
              price: plan.price_id,
              quantity: 1
            }
          ],
          automatic_tax: %{
            enabled: true
          },
          shipping_address_collection: %{
            allowed_countries: @shipping_allowed_countries
          },
          customer_update: %{
            shipping: :auto,
            address: :auto
          }
          # billing_address_collection: "required"
        },
        if(plan.recurring,
          do: %{
            mode: :subscription,
            allow_promotion_codes: true
          },
          else: %{
            mode: :payment,
            payment_intent_data: %{
              metadata: %{
                plan_id: plan.id
              }
            },
            discounts:
              if(:legacy_vrlfp in user.tags,
                do: [
                  %{coupon: "KoqHexUI"}
                ],
                else: []
              )
          }
        )
      )
    )
  end

  def manage(%User{stripe_id: nil} = user) do
    with {:ok, customer} <- update_customer(user) do
      Map.put(user, :stripe_id, customer.id)
      |> manage()
    end
  end

  def manage(%User{stripe_id: stripe_id}) do
    Stripe.BillingPortal.Session.create(%{
      customer: stripe_id,
      return_url:
        Application.fetch_env!(:flirtual, :frontend_origin)
        |> URI.merge("/subscription")
        |> URI.to_string()
    })
  end

  defp transform_user(%User{} = user) do
    %{
      email: user.email,
      description: user.username
    }
  end

  # User isn't an existing Stripe Customer, create one.
  def update_customer(%User{stripe_id: nil} = user) do
    with {:ok, customer} <- Stripe.Customer.create(transform_user(user)),
         {:ok, _} <-
           change(user, %{stripe_id: customer.id})
           |> Repo.update() do
      {:ok, customer}
    end
  end

  # User is an existing Stripe Customer, update their customer details.
  def update_customer(%User{stripe_id: stripe_id} = user) when is_binary(stripe_id) do
    Stripe.Customer.update(stripe_id, transform_user(user))
  end

  # User isn't an existing Stripe Customer, do nothing.
  def delete_customer(%User{stripe_id: nil}), do: {:ok, nil}

  def delete_customer(%User{stripe_id: stripe_id}) when is_binary(stripe_id) do
    case Stripe.Customer.delete(stripe_id) do
      {:ok, customer} -> {:ok, customer}
      {:error, %Stripe.Error{extra: %{http_status: 404}}} -> {:ok, nil}
    end
  end

  def get_customer(stripe_id) when is_binary(stripe_id) do
    case Stripe.Customer.retrieve(stripe_id, %{expand: ["subscriptions"]}) do
      {:ok, customer} -> {:ok, customer}
      {:error, %Stripe.Error{extra: %{http_status: 404}}} -> {:ok, nil}
    end
  end

  def get_customer(_), do: {:ok, nil}

  def get_subscription(stripe_id) when is_binary(stripe_id) do
    Stripe.Subscription.retrieve(stripe_id)
  end

  def cancel_subscription(%Subscription{stripe_id: stripe_id}, options \\ []) do
    subscription = get_subscription(stripe_id)

    with {:ok, %Stripe.Subscription{canceled_at: nil}} <- subscription,
         {:ok, _} <-
           if(Keyword.get(options, :superseded, false),
             do:
               Stripe.Subscription.update(stripe_id, %{
                 metadata: %{
                   "superseded" => "true"
                 }
               }),
             else: {:ok, nil}
           ),
         {:ok, subscription} <- Stripe.Subscription.cancel(stripe_id, %{prorate: true}) do
      {:ok, subscription}
    else
      {:error, %Stripe.Error{extra: %{http_status: 404}}} -> {:ok, subscription}
      {:ok, %Stripe.Subscription{} = subscription} -> {:ok, subscription}
      value -> value
    end
  end

  def cancel_subscription_at_period_end(%Subscription{stripe_id: stripe_id}) do
    subscription = get_subscription(stripe_id)

    with {:ok, %Stripe.Subscription{canceled_at: nil}} <- subscription,
         {:ok, subscription} <- Stripe.Subscription.update(stripe_id, %{cancel_at_period_end: true}) do
      {:ok, subscription}
    else
      {:error, %Stripe.Error{extra: %{http_status: 404}}} -> {:ok, subscription}
      {:ok, %Stripe.Subscription{} = subscription} -> {:ok, subscription}
      value -> value
    end
  end

  defp event_error(%Stripe.Event{} = event, value) do
    log(:error, [event.type, event.id], value)
    :error
  end

  # Ignore superseded subscription events.
  def handle_event(%Stripe.Event{
        type: type,
        data: %{
          object: %Stripe.Subscription{
            metadata: %{
              "superseded" => "true"
            }
          }
        }
      })
      when type in [
             "customer.subscription.updated",
             "customer.subscription.deleted"
           ],
      do: :ok

  def handle_event(
        %Stripe.Event{
          type: "payment_intent.succeeded",
          data: %{
            object: %Stripe.PaymentIntent{
              id: payment_stripe_id,
              customer: customer_stripe_id,
              metadata: %{
                "plan_id" => plan_id
              }
            }
          }
        } = event
      ) do
    with %User{} = user <- User.get(stripe_id: customer_stripe_id),
         %Plan{recurring: false} = plan <- Plan.get(plan_id),
         {:ok, subscription} <- Subscription.apply(:stripe, user, plan, payment_stripe_id) do
      log(:debug, [event.type, event.id], subscription)
      :ok
    else
      %Plan{} -> :ok
      value -> event_error(event, value)
    end
  end

  def handle_event(
        %Stripe.Event{
          type: type,
          data: %{
            object: %Stripe.Subscription{
              id: subscription_stripe_id,
              items: %{
                data: [
                  %Stripe.SubscriptionItem{
                    price: %{
                      id: price_id,
                      product: product_id
                    }
                  }
                ]
              },
              customer: customer_stripe_id,
              status: "active"
            }
          }
        } = event
      )
      when type in ["customer.subscription.created", "customer.subscription.updated"] do
    log(:debug, [event.type, event.id], event)

    with %User{} = user <- User.get(stripe_id: customer_stripe_id),
         # Legacy Supporter does not have a price_id, which means we can't
         # find their associated plan using the typical method, so we have
         # to hardcode it.
         %Plan{} = plan <-
           if(product_id === "prod_LGQim2AINber1U",
             do: Plan.get("43V699voRpLqskJEM42Vsa"),
             else: Plan.get(product_id: product_id, price_id: price_id)
           ),
         {:ok, subscription} <- Subscription.apply(:stripe, user, plan, subscription_stripe_id) do
      log(:debug, [event.type, event.id], subscription)
      :ok
    else
      value -> event_error(event, value)
    end
  end

  def handle_event(
        %Stripe.Event{
          type: "customer.subscription.deleted",
          data: %{
            object: %Stripe.Subscription{
              id: stripe_id
            }
          }
        } = event
      ) do
    with %Subscription{} = subscription <- Subscription.get(stripe_id: stripe_id),
         {:ok, _} <- Subscription.cancel(subscription) do
      :ok
    else
      nil -> :ok
      value -> event_error(event, value)
    end
  end

  @impl true
  def handle_event(_), do: :ok
end

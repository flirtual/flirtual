defmodule Flirtual.Subscription do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.Subscription.Policy

  require Flirtual.Utilities
  import Flirtual.Utilities

  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.Stripe
  alias Flirtual.Repo
  alias Flirtual.Plan
  alias Flirtual.User
  alias Flirtual.Subscription

  schema "subscriptions" do
    belongs_to :user, User
    belongs_to :plan, Plan

    field :active, :string, virtual: true
    field :stripe_id, :string
    field :cancelled_at, :naive_datetime

    timestamps(inserted_at: :created_at)
  end

  def default_assoc do
    [
      :plan
    ]
  end

  def apply(user, plan, stripe_id \\ nil)

  # Create subscription, since user doesn't have an existing one.
  def apply(%User{subscription: nil} = user, %Plan{} = plan, stripe_id)
      when is_binary(stripe_id) do
    %Subscription{}
    |> change(%{user_id: user.id, plan_id: plan.id, stripe_id: stripe_id})
    |> Repo.insert()
  end

  # Update subscription, stripe_id didn't change.
  def apply(
        %User{
          subscription:
            %Subscription{
              stripe_id: stripe_id
            } = subscription
        },
        %Plan{} = plan,
        stripe_id
      ) do
    change(subscription, %{plan_id: plan.id, cancelled_at: nil})
    |> Repo.update()
  end

  # Update subscription, and cancel existing Stripe subscription.
  def apply(
        %User{
          subscription:
            %Subscription{
              cancelled_at: nil
            } = subscription
        },
        %Plan{} = plan,
        stripe_id
      ) do
    with {:ok, _} <- Stripe.cancel_subscription(subscription, superseded: true),
         {:ok, subscription} <-
           subscription
           |> change(%{
             plan_id: plan.id,
             stripe_id: stripe_id || subscription.stripe_id,
             cancelled_at: nil
           })
           |> Repo.update() do
      {:ok, subscription}
    end
  end

  # Renew subscription, previous subscription already cancelled.
  def apply(%User{subscription: subscription}, %Plan{} = plan, stripe_id) do
    subscription
    |> change(%{
      plan_id: plan.id,
      stripe_id: stripe_id || subscription.stripe_id,
      cancelled_at: nil
    })
    |> Repo.update()
  end

  def cancel(%Subscription{} = subscription) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
    subscription |> change(%{cancelled_at: now}) |> Repo.update()
  end

  def get(user_id: user_id) when is_uuid(user_id) do
    Subscription |> where(user_id: ^user_id) |> Repo.one()
  end

  def get(stripe_id: stripe_id) when is_binary(stripe_id) do
    Subscription |> where(stripe_id: ^stripe_id) |> Repo.one()
  end

  def get(_), do: nil
end

defimpl Jason.Encoder, for: Flirtual.Subscription do
  def encode(value, opts) do
    Jason.Encode.map(
      Map.take(value, [
        :plan,
        :active,
        :cancelled_at,
        :updated_at,
        :created_at
      ])
      |> Map.filter(fn {_, value} -> value !== nil end),
      opts
    )
  end
end

defmodule Flirtual.Subscription.Policy do
  use Flirtual.Policy

  alias Flirtual.Subscription

  def authorize(:read, _, _), do: false
  def authorize(_, _, _), do: false

  def transform(:active, _, %Subscription{cancelled_at: nil}), do: true
  def transform(:active, _, %Subscription{}), do: false
end

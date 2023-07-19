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
    field :google_id, :string
    field :apple_id, :string
    field :cancelled_at, :utc_datetime

    timestamps()
  end

  def default_assoc do
    [
      :plan
    ]
  end

  def active?(%Subscription{cancelled_at: nil}), do: true
  def active?(_), do: false

  def reset_matchmaking_timer(profile) do
    profile
    |> change(%{reset_love_at: nil, reset_friend_at: nil})
    |> Repo.update()
  end

  def apply(user, plan, stripe_id \\ nil)

  # Create subscription, since user doesn't have an existing one.
  def apply(%User{subscription: nil} = user, %Plan{} = plan, stripe_id)
      when is_binary(stripe_id) do
    Repo.transaction(fn ->
      with {:ok, subscription} <-
             %Subscription{}
             |> change(%{user_id: user.id, plan_id: plan.id, stripe_id: stripe_id})
             |> Repo.insert(),
           {:ok, _} <-
             reset_matchmaking_timer(user.profile) do
        {:ok, subscription}
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  # Update subscription, stripe_id didn't change.
  def apply(
        %User{
          subscription:
            %Subscription{
              stripe_id: stripe_id
            } = subscription
        } = user,
        %Plan{} = plan,
        stripe_id
      ) do
    Repo.transaction(fn ->
      with {:ok, subscription} <-
             change(subscription, %{plan_id: plan.id, cancelled_at: nil})
             |> Repo.update(),
           {:ok, _} <-
             reset_matchmaking_timer(user.profile) do
        {:ok, subscription}
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  # Update subscription, and supersede existing Stripe subscription.
  def apply(
        %User{
          subscription:
            %Subscription{
              cancelled_at: nil
            } = subscription
        } = user,
        %Plan{} = plan,
        stripe_id
      ) do
    Repo.transaction(fn ->
      with {:ok, _} <- Stripe.cancel_subscription(subscription, superseded: true),
           {:ok, subscription} <-
             subscription
             |> change(%{
               plan_id: plan.id,
               stripe_id: stripe_id || subscription.stripe_id,
               cancelled_at: nil
             })
             |> Repo.update(),
           {:ok, _} <- reset_matchmaking_timer(user.profile) do
        {:ok, subscription}
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  # Renew subscription, previous subscription already cancelled.
  def apply(%User{subscription: subscription} = user, %Plan{} = plan, stripe_id) do
    Repo.transaction(fn ->
      with {:ok, subscription} <-
             subscription
             |> change(%{
               plan_id: plan.id,
               stripe_id: stripe_id || subscription.stripe_id,
               cancelled_at: nil
             })
             |> Repo.update(),
           {:ok, _} <- reset_matchmaking_timer(user.profile) do
        {:ok, subscription}
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def cancel(%Subscription{} = subscription) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)
    subscription |> change(%{cancelled_at: now}) |> Repo.update()
  end

  def get(user_id: user_id) when is_uid(user_id) do
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

  def transform(:active, _, %Subscription{} = subscription),
    do: Subscription.active?(subscription)
end

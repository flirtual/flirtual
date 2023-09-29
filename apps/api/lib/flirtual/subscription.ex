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
    belongs_to(:user, User)
    belongs_to(:plan, Plan)

    field(:active, :string, virtual: true)
    field(:platform, :string, virtual: true)

    field(:stripe_id, :string)
    field(:google_id, :string)
    field(:apple_id, :string)
    field(:cancelled_at, :utc_datetime)

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
    |> change(%{queue_love_reset_at: nil, queue_friend_reset_at: nil})
    |> Repo.update()
  end

  defp update_platform_id(platform_id, event_id) do
    case platform_id do
      "APP_STORE" -> %{apple_id: event_id, google_id: nil, stripe_id: nil}
      "MAC_APP_STORE" -> %{apple_id: event_id, google_id: nil, stripe_id: nil}
      "PLAY_STORE" -> %{google_id: event_id, apple_id: nil, stripe_id: nil}
    end
  end

  def apply(source, user, plan, stripe_id \\ nil)

  # Stripe: Create subscription, since user doesn't have an existing one.
  def apply(:stripe, %User{subscription: nil} = user, %Plan{} = plan, stripe_id)
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

  # Stripe: Update subscription, stripe_id didn't change.
  def apply(
        :stripe,
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
             change(subscription, %{
               plan_id: plan.id,
               apple_id: nil,
               google_id: nil,
               cancelled_at: nil
             })
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

  # Stripe: Update subscription, and supersede existing Stripe subscription.
  def apply(
        :stripe,
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
               apple_id: nil,
               google_id: nil,
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

  # Stripe: Renew subscription, previous subscription already cancelled.
  def apply(:stripe, %User{subscription: subscription} = user, %Plan{} = plan, stripe_id) do
    Repo.transaction(fn ->
      with {:ok, subscription} <-
             subscription
             |> change(%{
               plan_id: plan.id,
               stripe_id: stripe_id || subscription.stripe_id,
               apple_id: nil,
               google_id: nil,
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

  # Ignore event when platform doesn't match existing subscription.
  def apply(
        _,
        %User{
          subscription: %Subscription{
            apple_id: apple_id,
            cancelled_at: nil
          }
        },
        _,
        platform,
        _
      )
      when not is_nil(apple_id) and platform not in ["APP_STORE", "MAC_APP_STORE"] do
    {:unhandled, :platform_mismatch}
  end

  def apply(
        _,
        %User{
          subscription: %Subscription{
            google_id: google_id,
            cancelled_at: nil
          }
        },
        _,
        platform,
        _
      )
      when not is_nil(google_id) and platform != "PLAY_STORE" do
    {:unhandled, :platform_mismatch}
  end

  # RevenueCat: Create subscription, since user doesn't have an existing one.
  def apply(:revenuecat, %User{subscription: nil} = user, %Plan{} = plan, platform, event_id) do
    Repo.transaction(fn ->
      with {:ok, subscription} <-
             %Subscription{}
             |> change(
               %{user_id: user.id, plan_id: plan.id}
               |> Map.merge(update_platform_id(platform, event_id))
             )
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

  # RevenueCat: Renew subscription, possibly updating plan.
  def apply(
        :revenuecat,
        %User{
          subscription: %Subscription{} = subscription
        } = user,
        %Plan{} = plan,
        platform,
        event_id
      ) do
    Repo.transaction(fn ->
      with {:ok, subscription} <-
             subscription
             |> change(
               %{plan_id: plan.id, cancelled_at: nil}
               |> Map.merge(update_platform_id(platform, event_id))
             )
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
        :platform,
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

  def transform(:platform, _, %Subscription{apple_id: apple_id}) when is_binary(apple_id),
    do: :ios

  def transform(:platform, _, %Subscription{google_id: google_id}) when is_binary(google_id),
    do: :android

  def transform(:platform, _, _),
    do: :web
end

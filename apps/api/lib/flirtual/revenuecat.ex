defmodule Flirtual.RevenueCat do
  use Flirtual.Logger, :revenuecat

  alias Flirtual.Plan
  alias Flirtual.Repo
  alias Flirtual.User
  alias Flirtual.Subscription

  import Ecto.Changeset

  def handle_event(
        %{
          event: %{
            type: type,
            product_id: product_id,
            app_user_id: customer_id,
            store: platform,
            id: event_id
          }
        } = event
      )
      when type in ["INITIAL_PURCHASE", "RENEWAL"] do
    with %User{} = user <- User.get(revenuecat_id: customer_id),
         %Plan{} = plan <- Plan.get(revenuecat_id: product_id),
         {:ok, subscription} <- Subscription.apply(:revenuecat, user, plan, platform, event_id) do
      log(:info, [event.type, event.id], subscription)
      :ok
    end
  end

  def handle_event(
        %{
          event: %{
            type: "EXPIRATION",
            app_user_id: customer_id
          }
        }
      ) do
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

  def delete(user) do
    # delete customer if exists
  end
end

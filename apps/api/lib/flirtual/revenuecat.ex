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
            type: "INITIAL_PURCHASE",
            product_id: product_id,
            app_user_id: customer_id
          }
        } = event
      ) do
    with %User{} = user <- User.get(revenuecat_id: customer_id),
         %Plan{} = plan <- Plan.get(revenuecat_id: product_id),
         {:ok, subscription} <- Subscription.apply(:revenuecat, user, plan) do
      log(:info, [event.type, event.id], subscription)
      :ok
    end
  end

  def handle_event(
        %{
          event: %{
            type: "RENEWAL",
            product_id: product_id,
            app_user_id: customer_id
          }
        } = event
      ) do
    # add subscription / update plan
  end

  def handle_event(
        %{
          event: %{
            type: "EXPIRATION",
            product_id: product_id,
            app_user_id: customer_id
          }
        } = event
      ) do
    # expire subscription
  end

  def handle_event(event) do
    IO.inspect(event)
    :ok
  end
end

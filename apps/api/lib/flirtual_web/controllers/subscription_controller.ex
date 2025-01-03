defmodule FlirtualWeb.SubscriptionController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import FlirtualWeb.Utilities
  import Phoenix.Controller

  alias Flirtual.{Chargebee, Plan, Policy, Stripe}

  action_fallback(FlirtualWeb.FallbackController)

  def list_plans(conn, _) do
    plans = Policy.transform(conn, Plan.list())

    conn
    |> cache_control([:public, :immutable, {"max-age", [day: 1]}])
    |> json_with_etag(plans)
  end

  def checkout(conn, %{"plan_id" => plan_id}) do
    with %Plan{purchasable: true} = plan <- Plan.get(plan_id),
         {:ok, url} <- Chargebee.checkout(conn.assigns[:session].user, plan) do
      conn |> redirect(external: url)
    else
      %Plan{} ->
        conn
        |> html(
          "<div style='height: 100%; text-align: center; align-content: center; font-family: sans-serif'>There was an error completing your purchase, please try again. You have not been charged.</div>"
        )

      nil ->
        conn
        |> html(
          "<div style='height: 100%; text-align: center; align-content: center; font-family: sans-serif'>There was an error completing your purchase, please try again. You have not been charged.</div>"
        )

      {:error, :payments_banned} ->
        conn
        |> html(
          "<div style='height: 100%; text-align: center; align-content: center; font-family: sans-serif'>Sorry, Premium is currently unavailable for purchase.</div>"
        )

      value ->
        value
    end
  end

  def manage(conn, _) do
    with {:ok, url} <- Chargebee.manage(conn.assigns[:session].user) do
      conn |> redirect(external: url)
    else
      value -> value
    end
  end

  def cancel(conn, _) do
    subscription = conn.assigns[:session].user.subscription

    if is_nil(subscription) do
      {:error, {:not_found, :subscription_not_found}}
    else
      with {:ok, _} <- Stripe.cancel_subscription_at_period_end(subscription) do
        conn |> json(%{success: true})
      end
    end
  end
end

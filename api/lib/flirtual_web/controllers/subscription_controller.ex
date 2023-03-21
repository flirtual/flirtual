defmodule FlirtualWeb.SubscriptionController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller

  alias Flirtual.Policy
  alias Flirtual.Plan
  alias Flirtual.Stripe

  action_fallback FlirtualWeb.FallbackController

  def list_plans(conn, _) do
    conn |> json(Policy.transform(conn, Plan.list()))
  end

  def checkout(conn, %{"plan" => plan_id}) do
    with %Plan{} = plan <- Plan.get(plan_id),
         {:ok, checkout_session} <- Stripe.checkout(conn.assigns[:session].user, plan) do
      conn |> json(%{url: checkout_session.url})
    else
      nil -> {:error, {:not_found, "Plan not found"}}
      value -> value
    end
  end
end

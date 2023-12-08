defmodule FlirtualWeb.SubscriptionController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import FlirtualWeb.Utilities
  import Phoenix.Controller

  alias Flirtual.Plan
  alias Flirtual.Policy
  alias Flirtual.Stripe

  action_fallback(FlirtualWeb.FallbackController)

  def list_plans(conn, _) do
    plans = Policy.transform(conn, Plan.list())

    conn
    |> put_resp_header("cache-control", "public, max-age=86400, immutable")
    |> json_with_etag(plans)
  end

  def checkout(conn, %{"plan_id" => plan_id}) do
    with %Plan{purchasable: true} = plan <- Plan.get(plan_id),
         {:ok, session} <- Stripe.checkout(conn.assigns[:session].user, plan) do
      conn |> redirect(external: session.url)
    else
      %Plan{} -> {:error, {:not_found, "Plan not purchasable"}}
      nil -> {:error, {:not_found, "Plan not found"}}
      value -> value
    end
  end

  def manage(conn, _) do
    with {:ok, session} <- Stripe.manage(conn.assigns[:session].user) do
      conn |> redirect(external: session.url)
    else
      value -> value
    end
  end
end

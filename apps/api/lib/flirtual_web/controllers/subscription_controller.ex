defmodule FlirtualWeb.SubscriptionController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import FlirtualWeb.Utilities
  import Phoenix.Controller

  alias Flirtual.{Chargebee, Plan, Policy}

  action_fallback(FlirtualWeb.FallbackController)

  def list_plans(conn, _) do
    plans = Policy.transform(conn, Plan.list())

    conn
    |> cache_control([:public, :immutable, {"max-age", [day: 1]}])
    |> json_with_etag(plans)
  end

  def checkout(conn, %{"plan_id" => plan_id}) do
    with %Plan{purchasable: true} = plan <- Plan.get(plan_id),
         {:ok, %Chargebeex.HostedPage{} = hosted_page} <-
           Chargebee.checkout(conn.assigns[:session].user, plan) do
      conn |> json(serialize_hosted_page(hosted_page))
    else
      %Plan{} ->
        {:error, {:bad_request, :plan_not_available}}

      nil ->
        {:error, {:not_found, :plan_not_available}}

      {:error, :payments_banned} ->
        {:error, {:forbidden, :checkout_not_available}}

      value ->
        value
    end
  end

  def manage(conn, _) do
    with {:ok, %Chargebeex.PortalSession{} = portal_session} <-
           Chargebee.manage(conn.assigns[:session].user) do
      conn |> json(serialize_portal_session(portal_session))
    else
      value -> value
    end
  end

  defp serialize_hosted_page(%Chargebeex.HostedPage{} = hosted_page) do
    %{
      id: hosted_page.id,
      type: hosted_page.type,
      url: hosted_page.url,
      state: hosted_page.state,
      embed: hosted_page.embed,
      created_at: hosted_page.created_at,
      expires_at: hosted_page.expires_at,
      object: "hosted_page"
    }
  end

  defp serialize_portal_session(%Chargebeex.PortalSession{} = portal_session) do
    %{
      id: portal_session.id,
      token: portal_session.token,
      access_url: portal_session.access_url,
      status: portal_session.status,
      customer_id: portal_session.customer_id,
      redirect_url: portal_session.redirect_url,
      created_at: portal_session.created_at,
      expires_at: portal_session.expires_at,
      linked_customers: portal_session.linked_customers,
      object: "portal_session"
    }
  end
end

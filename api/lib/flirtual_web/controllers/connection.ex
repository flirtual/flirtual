defmodule FlirtualWeb.ConnectionController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller
  import Ecto.Changeset
  import Flirtual.Utilities

  alias Flirtual.Repo
  alias Flirtual.Connection

  action_fallback FlirtualWeb.FallbackController

  defp assign_state(conn, state) do
    conn |> put_session(:state, state)
  end

  defp validate_state(conn, state) do
    if get_session(conn, :state) !== state do
      {:error, {:bad_request, "State mismatch"}}
    else
      {:ok, conn}
    end
  end

  def list_available(conn, _) do
    conn
    |> json(Connection.list_available(conn.assigns[:session].user))
  end

  def authorize(conn, %{"type" => type, "next" => next}) do
    type = to_atom(type)

    state =
      :crypto.strong_rand_bytes(8)
      |> Base.encode16(case: :lower)

    with {:ok, provider} <- Connection.provider(type),
         {:ok, authorize_url} <- provider.authorize_url(conn, %{state: state}) do
      conn
      |> assign_state(state)
      |> put_session(:next, next)
      |> redirect(external: authorize_url |> URI.to_string())
    else
      {:error, :provider_not_found} ->
        {:error, {:not_found, "Provider not found", %{type: type}}}

      {:error, :not_supported} ->
        {:error, {:bad_request, "Authorize not supported", %{type: type}}}

      reason ->
        reason
    end
  end

  def grant(conn, %{"type" => type, "code" => code, "state" => state}) do
    user = conn.assigns[:session].user
    type = to_atom(type)

    with {:ok, provider} <- Connection.provider(type),
         {:ok, conn} <- validate_state(conn, state),
         {:ok, authorization} <- provider.exchange_code(code),
         {:ok, profile} <- provider.get_profile(authorization),
         connection <- Connection.get(user.id, type),
         {:ok, _} <-
           Connection.changeset(connection || %Connection{}, profile)
           |> change(%{user_id: user.id, type: type})
           |> Repo.insert_or_update() do
      next = get_session(conn, :next)

      conn
      |> delete_session(:state)
      |> delete_session(:next)
      |> redirect(external: next)
    else
      {:error, :provider_not_found} ->
        {:error, {:not_found, "Provider not found", %{type: type}}}

      {:error, :not_supported} ->
        {:error, {:bad_request, "Grant not supported", %{type: type}}}

      {:error, :invalid_grant} ->
        {:error, {:bad_request, "Invalid grant", %{type: type}}}

      {:error, :upstream} ->
        {:error, {:bad_request, "Upstream error", %{type: type}}}

      reason ->
        reason
    end
  end
end

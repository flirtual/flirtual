defmodule FlirtualWeb.SessionTransferController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller

  alias Flirtual.User
  alias Flirtual.User.{Session, SessionTransfer}
  alias FlirtualWeb.SessionController

  action_fallback(FlirtualWeb.FallbackController)

  @fifteen_minutes 900_000

  def create(conn, _) do
    %Session{user_id: user_id} = session = conn.assigns[:session]

    case ExRated.check_rate("session_transfer:#{user_id}", @fifteen_minutes, 10) do
      {:ok, _} ->
        with {:ok, transfer} <- SessionTransfer.create(session) do
          conn |> put_status(:created) |> json(%{token: transfer.token})
        end

      {:error, _} ->
        {:error, {:too_many_requests, :session_transfer_rate_limit}}
    end
  end

  def consume(conn, %{"token" => token} = params) do
    next = next_url(params["next"])

    case SessionTransfer.consume(token) do
      %Session{user: %User{banned_at: nil} = user} = session ->
        Session.delete(id: session.id)

        {_, conn} = SessionController.create(conn, user, method: :transfer)
        conn |> redirect(external: next)

      _ ->
        conn |> redirect(external: next)
    end
  end

  defp next_url(next) do
    destination =
      case URI.parse(next || "") do
        %URI{path: "/" <> _ = path} = uri -> %URI{path: path, query: uri.query}
        _ -> %URI{path: "/"}
      end

    Application.fetch_env!(:flirtual, :frontend_origin)
    |> URI.merge(destination)
    |> to_string()
  end
end

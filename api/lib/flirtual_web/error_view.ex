defmodule FlirtualWeb.ErrorView do
  use FlirtualWeb, :controller
  require Logger

  import FlirtualWeb.ErrorHelpers

  def render(_, %{conn: conn, status: 500}) do
    Logger.critical(
      "Unexpected request error: " <>
        inspect(conn.assigns.reason) <> "\n\n" <> format_stack(conn.assigns.stack)
    )

    conn |> put_error(:internal_server_error) |> halt()
  end

  def render(_, %{conn: conn, status: status}) do
    conn |> put_error(Plug.Conn.Status.reason_atom(status)) |> halt()
  end
end

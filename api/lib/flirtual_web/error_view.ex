defmodule FlirtualWeb.ErrorView do
  use FlirtualWeb, :controller

  import FlirtualWeb.ErrorHelpers

  def render(_, %{ conn: conn, status: status }) do
    conn |> put_error(Plug.Conn.Status.reason_atom(status)) |> halt()
  end
end

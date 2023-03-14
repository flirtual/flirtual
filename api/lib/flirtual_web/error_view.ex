defmodule FlirtualWeb.ErrorView do
  use FlirtualWeb, :controller
  require Logger

  import FlirtualWeb.ErrorHelpers

  def render(_, %{conn: conn, status: status}) do
    new_error(Plug.Conn.Status.code(status) |> Plug.Conn.Status.reason_phrase())
  end
end

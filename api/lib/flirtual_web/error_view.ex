defmodule FlirtualWeb.ErrorView do
  use FlirtualWeb, :controller
  require Logger

  import FlirtualWeb.ErrorHelpers
  alias Flirtual.Crypto
  alias Plug.Conn

  def render(_, %{status: 404}) do
    new_error(Conn.Status.reason_phrase(404))
  end

  def render(_, %{status: 400}) do
    new_error(Conn.Status.reason_phrase(400))
  end

  def render(_, %{reason: reason, status: status}) do
    message =
      Conn.Status.code(status)
      |> Conn.Status.reason_phrase()

    new_error(
      message,
      %{code: Crypto.encrypt(:error, reason)}
    )
  end
end

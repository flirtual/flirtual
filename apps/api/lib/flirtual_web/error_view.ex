defmodule FlirtualWeb.ErrorView do
  use FlirtualWeb, :controller
  require Logger

  alias Plug.Conn
  alias FlirtualWeb.ErrorHelpers.Issue

  def render(_, %{status: 404}) do
    Issue.new(Conn.Status.reason_phrase(404))
  end

  def render(_, %{status: 400}) do
    Issue.new(Conn.Status.reason_phrase(400))
  end

  def render(_, %{reason: reason, status: status}) do
    message =
      Conn.Status.code(status)
      |> Conn.Status.reason_phrase()

    Issue.new(message)
  end
end

defmodule FlirtualWeb.CustomHeaders do
  @moduledoc """
  Stamps each response with `x-flirtual-*` headers describing the machine that
  served it, so a preview can be traced back to its Fly Machine and commit
  even when the router in front isn't in the picture.
  """

  import Plug.Conn

  @behaviour Plug

  @impl true
  def init(options), do: options

  @impl true
  def call(conn, _options) do
    headers = Application.get_env(:flirtual, :custom_headers, [])

    register_before_send(conn, fn conn ->
      Enum.reduce(headers, conn, fn {name, value}, conn ->
        put_resp_header(conn, name, value)
      end)
    end)
  end
end

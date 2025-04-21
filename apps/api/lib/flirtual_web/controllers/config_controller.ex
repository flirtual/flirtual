defmodule FlirtualWeb.ConfigController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller
  import FlirtualWeb.Utilities

  alias Flirtual.Attribute

  action_fallback(FlirtualWeb.FallbackController)

  def get(conn, _) do
    conn
    # |> cache_control([:public, :immutable, {"max-age", [minute: 5]}])
    |> json_with_etag(%{
      cache_version: 1_745_196_165_945
    })
  end
end

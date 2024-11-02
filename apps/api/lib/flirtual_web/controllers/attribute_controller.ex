defmodule FlirtualWeb.AttributeController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller
  import FlirtualWeb.Utilities

  alias Flirtual.Attribute

  action_fallback(FlirtualWeb.FallbackController)

  def get(conn, %{"attribute_type" => attribute_type, "attribute_id" => attribute_id}) do
    attributes = Attribute.get(attribute_id, attribute_type)

    conn
    |> cache_control([:public, :immutable, {"max-age", [day: 1]}])
    |> json_with_etag(attributes)
  end

  def list(conn, %{"attribute_type" => attribute_type}) do
    attributes = Attribute.list(type: attribute_type) |> Attribute.compress()

    conn
    |> cache_control([:public, :immutable, {"max-age", [day: 1]}])
    |> json_with_etag(attributes)
  end
end

defmodule FlirtualWeb.AttributeController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller

  alias Flirtual.Attribute

  action_fallback FlirtualWeb.FallbackController

  def get(conn, %{"attribute_type" => attribute_type, "attribute_id" => attribute_id}) do
    attributes = Attribute.get(attribute_id, attribute_type)

    conn
    |> put_resp_header("cache-control", "public, max-age=86400, immutable")
    |> json(attributes)
  end

  def list(conn, %{"attribute_type" => attribute_type}) do
    attributes = Attribute.list(type: attribute_type)

    conn
    |> put_resp_header("cache-control", "public, max-age=86400, immutable")
    |> json(attributes)
  end
end

defmodule FlirtualWeb.AttributeController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller

  alias Flirtual.Attribute

  action_fallback FlirtualWeb.FallbackController

  def list(conn, %{"attribute_type" => attribute_type}) do
    attributes = Attribute.by_type(attribute_type)
    conn |> json(attributes)
  end
end

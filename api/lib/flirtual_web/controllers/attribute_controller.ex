defmodule FlirtualWeb.AttributeController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller

  alias Flirtual.Languages
  alias Flirtual.Countries

  alias Flirtual.Attribute

  action_fallback FlirtualWeb.FallbackController

  def list(conn, %{"attribute_type" => "country"}) do
    conn
    |> json(
      Countries.list()
      |> Enum.map(
        &%Attribute{
          id: &1[:iso_3166_1],
          name: &1[:name],
          metadata: %{
            "flag_url" =>
              "https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/4.1.4/flags/4x3/" <>
                &1[:iso_3166_1] <> ".svg"
          }
        }
      )
    )
  end

  def list(conn, %{"attribute_type" => "language"}) do
    conn
    |> json(
      Languages.list()
      |> Enum.map(
        &%Attribute{
          id: &1[:iso_639_1],
          name: &1[:name]
        }
      )
    )
  end

  def list(conn, %{"attribute_type" => attribute_type}) do
    attributes = Attribute.by_type(attribute_type)
    conn |> json(attributes)
  end
end

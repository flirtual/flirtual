defmodule FlirtualWeb.ConfigController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller
  import FlirtualWeb.Utilities

  alias Flirtual.Attribute

  action_fallback(FlirtualWeb.FallbackController)

  def get(conn, _) do
    country =
      conn
      |> get_req_header("cf-ipcountry")
      |> List.first()
      |> case do
        "XX" ->
          nil

        "T1" ->
          nil

        country when is_binary(country) ->
          String.downcase(country)

        _ ->
          nil
      end

    json_with_etag(conn, %{
      country: country
    })
  end
end

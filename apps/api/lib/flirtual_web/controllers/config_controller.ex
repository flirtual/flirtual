defmodule FlirtualWeb.ConfigController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller
  import FlirtualWeb.Utilities

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

  def timezones(conn, _) do
    now = DateTime.utc_now()

    timezones =
      TzExtra.time_zone_ids()
      |> Enum.reject(&String.starts_with?(&1, "Etc/"))
      |> Enum.map(fn id ->
        {:ok, dt} = DateTime.shift_zone(now, id)
        offset = dt.utc_offset + dt.std_offset
        city = id |> String.split("/") |> List.last()
        {id, offset, city}
      end)
      |> Enum.sort_by(fn {_id, offset, city} -> {offset, city} end)
      |> Enum.map(fn {id, offset, _city} -> %{id: id, offset: offset} end)

    json_with_etag(conn, timezones)
  end
end

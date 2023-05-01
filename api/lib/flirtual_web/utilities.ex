defmodule FlirtualWeb.Utilities do
  import Flirtual.Utilities

  import Plug.Conn
  import Phoenix.Controller

  def split_to_atom_list(value, separator \\ ",")
  def split_to_atom_list(nil, _), do: []
  def split_to_atom_list("", _), do: []

  def split_to_atom_list(value, separator) when is_binary(value) do
    value |> String.split(separator) |> Enum.map(&to_atom(&1))
  end

  def split_to_atom_list(_, _), do: []

  def json_with_etag(conn, term) do
    etag = ~s[W/"#{term |> :erlang.phash2() |> Integer.to_string(16)}"]

    conn =
      conn
      |> put_resp_header("cache-control", "private")
      |> put_resp_header("etag", etag)

    if etag in get_req_header(conn, "if-none-match") do
      send_resp(conn, 304, "")
    else
      json(conn, term)
    end
  end
end

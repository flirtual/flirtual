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

  defp cache_control_duration_to_seconds(duration) do
    duration
    |> Enum.reduce(0, fn
      {:second, val}, acc -> acc + val
      {:minute, val}, acc -> acc + val * 60
      {:hour, val}, acc -> acc + val * 3600
      {:day, val}, acc -> acc + val * 86_400
      _, acc -> acc
    end)
  end

  @cache_control_duration_directives [
    "max-age",
    "s-maxage",
    "stale-while-revalidate",
    "stale-if-error",
    "max-stale"
  ]

  defp cache_control_format_option({key, value}) when key in @cache_control_duration_directives do
    "#{key}=#{cache_control_duration_to_seconds(value)}"
  end

  defp cache_control_format_option({key, value}) do
    "#{key}=#{value}"
  end

  defp cache_control_format_option(key) when is_atom(key), do: Atom.to_string(key)
  defp cache_control_format_option(key) when is_binary(key), do: key

  defp exclude_cache?(conn) do
    tags = get_in(conn.assigns, [:session, :user, :tags]) || []
    :admin in tags or :moderator in tags
  end

  def cache_control(conn, options \\ []) do
    options =
      if exclude_cache?(conn) and not Enum.member?(options, :always) do
        [:private, :"no-cache", :"no-store"]
      else
        options -- [:always]
      end

    conn
    |> put_resp_header(
      "cache-control",
      options
      |> Enum.map(&cache_control_format_option/1)
      |> Enum.join(", ")
    )
  end

  def json_with_etag(conn, term) do
    etag = ~s[W/"#{term |> :erlang.phash2() |> Integer.to_string(16)}"]

    cache_control =
      get_resp_header(conn, "cache-control")
      |> List.first() || "private"

    conn =
      conn
      |> put_resp_header("cache-control", cache_control)
      |> put_resp_header("etag", etag)

    if etag in get_req_header(conn, "if-none-match") do
      send_resp(conn, 304, "")
    else
      json(conn, term)
    end
  end

  def get_conn_ip(conn) do
    forwarded_for =
      conn
      |> get_req_header("x-forwarded-for")
      |> List.first()

    if forwarded_for do
      forwarded_for
      |> String.split(",")
      |> Enum.map(&String.trim/1)
      |> List.first()
    else
      conn.remote_ip
      |> :inet_parse.ntoa()
      |> to_string()
    end
  end
end

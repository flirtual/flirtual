defmodule FlirtualWeb.CacheBodyReader do
  @cached_paths ["/v1/age-verification/notification"]

  def read_body(%Plug.Conn{} = conn, options) do
    {:ok, body, conn} = Plug.Conn.read_body(conn, options)

    conn =
      if conn.request_path in @cached_paths,
        do: Plug.Conn.assign(conn, :raw_body, [body | conn.assigns[:raw_body] || []]),
        else: conn

    {:ok, body, conn}
  end

  def raw_body(%Plug.Conn{assigns: %{raw_body: chunks}}) when is_list(chunks),
    do: chunks |> Enum.reverse() |> IO.iodata_to_binary()

  def raw_body(_), do: nil
end

if Code.ensure_loaded?(Tidewave) do
  defmodule FlirtualWeb.Tidewave do
    @behaviour Plug

    import Plug.Conn

    @impl true
    def init(opts), do: Tidewave.init(opts)

    # Don't trust connections from Cloudflare tunnel, only local.
    @impl true
    def call(%Plug.Conn{path_info: ["tidewave" | _]} = conn, opts) do
      if Enum.any?(~w(cf-ray cf-connecting-ip), &(get_req_header(conn, &1) != [])) do
        conn
        |> send_resp(403, "Forbidden")
        |> halt()
      else
        Tidewave.call(conn, opts)
      end
    end

    def call(conn, opts), do: Tidewave.call(conn, opts)
  end
end

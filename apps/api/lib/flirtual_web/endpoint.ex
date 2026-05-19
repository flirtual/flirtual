defmodule FlirtualWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :flirtual

  socket("/live", Phoenix.LiveView.Socket,
    websocket: [connect_info: [session: {FlirtualWeb.Session, :options, []}]]
  )

  use Sentry.PlugCapture

  if Code.ensure_loaded?(Tidewave) do
    plug Tidewave
  end

  # Code reloading can be explicitly enabled under the
  # :code_reloader configuration of your endpoint.
  if code_reloading? do
    plug(Phoenix.CodeReloader)
    plug(Phoenix.Ecto.CheckRepoStatus, otp_app: :flirtual)
  end

  def get_origins() do
    MapSet.new([
      Application.fetch_env!(:flirtual, :root_origin),
      Application.fetch_env!(:flirtual, :origin),
      Application.fetch_env!(:flirtual, :frontend_origin),
      Application.fetch_env!(:flirtual, :frontend_origin)
      |> URI.new!()
      |> Map.put(:scheme, "capacitor")
      |> Map.put(:port, nil)
    ])
    |> MapSet.to_list()
    |> Enum.map(&to_string/1)
  end

  plug(CORSPlug,
    origin: &__MODULE__.get_origins/0,
    headers: [
      "content-type",
      "idempotency-key",
      "retry-count",
      "cache-control",
      "sentry-trace",
      "baggage"
    ],
    expose: [
      "retry-after",
      "etag"
    ]
  )

  plug(Phoenix.LiveDashboard.RequestLogger,
    param_key: "request_logger",
    cookie_key: "request_logger"
  )

  plug(Plug.RequestId, http_header: "fly-request-id")
  plug(Plug.Telemetry, event_prefix: [:phoenix, :endpoint])

  plug(Plug.MethodOverride)
  plug(Plug.Head)

  plug(Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()
  )

  plug(Sentry.PlugContext,
    request_id_header: "fly-request-id"
  )

  plug(FlirtualWeb.Session)

  plug(FlirtualWeb.Router)
end

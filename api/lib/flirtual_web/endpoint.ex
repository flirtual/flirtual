defmodule FlirtualWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :flirtual

  # Code reloading can be explicitly enabled under the
  # :code_reloader configuration of your endpoint.
  if code_reloading? do
    plug Phoenix.CodeReloader
    plug Phoenix.Ecto.CheckRepoStatus, otp_app: :flirtual
  end

  plug Phoenix.LiveDashboard.RequestLogger,
    param_key: "request_logger",
    cookie_key: "request_logger"

  plug CORSPlug,
    origin: MapSet.new([
      Application.compile_env!(:flirtual, :frontend_origin) |> URI.to_string(),
      Application.compile_env!(:flirtual, :origin) |> URI.to_string(),
    ]) |> MapSet.to_list()

  plug Plug.RequestId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()

  plug Plug.MethodOverride
  plug Plug.Head

  plug Plug.Session,
    store: :cookie,
    domain: Application.compile_env!(:flirtual, :frontend_origin).host,
    same_site: "Lax",
    key: "session",
    signing_salt: "mGFTg14t"

  plug FlirtualWeb.Router
end

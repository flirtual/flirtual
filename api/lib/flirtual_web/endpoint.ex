defmodule FlirtualWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :flirtual

  alias Flirtual.User.Session

  # Code reloading can be explicitly enabled under the
  # :code_reloader configuration of your endpoint.
  if code_reloading? do
    plug Phoenix.CodeReloader
    plug Phoenix.Ecto.CheckRepoStatus, otp_app: :flirtual
  end

  plug CORSPlug,
    origin:
      MapSet.new([
        Application.compile_env!(:flirtual, :root_origin) |> URI.to_string(),
        Application.compile_env!(:flirtual, :frontend_origin) |> URI.to_string(),
        Application.compile_env!(:flirtual, :origin) |> URI.to_string()
      ])
      |> MapSet.to_list()

  plug Plug.RequestId, http_header: "fly-request-id"
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  plug Stripe.WebhookPlug,
    at: "/v1/stripe",
    handler: Flirtual.Stripe,
    secret: {Application, :fetch_env!, [:stripity_stripe, :signing_secret]}

  plug Plug.MethodOverride
  plug Plug.Head

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()

  plug Plug.Session,
    store: :cookie,
    domain: Application.compile_env!(:flirtual, :root_origin).host,
    same_site: "Lax",
    max_age: Session.max_age(),
    key: "session",
    signing_salt: "mGFTg14t"

  plug FlirtualWeb.Router
end

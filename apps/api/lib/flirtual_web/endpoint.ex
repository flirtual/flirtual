defmodule FlirtualWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :flirtual

  alias Flirtual.User.Session

  # Code reloading can be explicitly enabled under the
  # :code_reloader configuration of your endpoint.
  if code_reloading? do
    plug(Phoenix.CodeReloader)
    plug(Phoenix.Ecto.CheckRepoStatus, otp_app: :flirtual)
  end

  def get_origins() do
    MapSet.new([
      Application.fetch_env!(:flirtual, :root_origin),
      Application.fetch_env!(:flirtual, :frontend_origin),
      Application.fetch_env!(:flirtual, :origin)
    ])
    |> MapSet.to_list()
    |> Enum.map(&to_string/1)
  end

  def get_root_host() do
    Application.fetch_env!(:flirtual, :root_origin)
    |> Map.get(:host)
  end

  plug(CORSPlug,
    origin: &__MODULE__.get_origins/0
  )

  plug(Plug.RequestId, http_header: "fly-request-id")
  plug(Plug.Telemetry, event_prefix: [:phoenix, :endpoint])

  plug(Stripe.WebhookPlug,
    at: "/v1/stripe",
    handler: Flirtual.Stripe,
    secret: {Application, :fetch_env!, [:stripity_stripe, :signing_secret]}
  )

  plug(Plug.MethodOverride)
  plug(Plug.Head)

  plug(Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()
  )

  plug(FlirtualWeb.Session)

  plug(FlirtualWeb.Router)
end

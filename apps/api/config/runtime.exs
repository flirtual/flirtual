import Config

defmodule Env do
  import Config

  def get(name, opts \\ []) do
    case System.get_env(name) do
      value when value in [nil, ""] -> opts[:default]
      value -> value
    end
  end

  # Required in production (or with always?: true); falls back to opts[:default] otherwise.
  def get!(name, opts \\ []) do
    case get(name) do
      nil ->
        if config_env() == :prod or opts[:always?] == true,
          do: raise("missing environment variable: #{name}"),
          else: opts[:default]

      value ->
        value
    end
  end

  def bool(name, opts \\ []) do
    case get(name) do
      value when value in ~w(true 1) -> true
      value when value in ~w(false 0) -> false
      _ -> opts[:default]
    end
  end
end

hostname = Env.get("HOSTNAME", default: elem(:inet.gethostname(), 1))

prod? = config_env() == :prod
dev? = not prod?
canary? = Env.bool("CANARY", default: false)

environment_name =
  cond do
    prod? and canary? -> :canary
    prod? -> :production
    dev? -> :development
    true -> config_env()
  end

if Env.get("PHX_SERVER") && Env.get("RELEASE_NAME") do
  config :flirtual, FlirtualWeb.Endpoint, server: true
end

config :flirtual,
  canary?: canary?,
  session_signing_salt: Env.get!("SESSION_SIGNING_SALT", default: "local_M0aOkiQYko"),
  # Shared dev tokens: must match apps/image-classification/.env.local and flirtualbot.
  image_access_token:
    Env.get!("IMAGE_ACCESS_TOKEN",
      default: "local_lk8agDaGutgEWwTBssV2f1Y0bOctRAHa89AZgmjFUh462F0N32tPwTjtynG"
    ),
  feedback_access_token:
    Env.get!("FEEDBACK_ACCESS_TOKEN",
      default: "local_u3HxXMz7yp0KxkewdJkUQQSCjZJZLehA6TFdgpQaKj8Zxmo4OxIygcUWvhy"
    )

origin = URI.parse(Env.get!("ORIGIN", default: "https://#{hostname}:4001"))
frontend_origin = Env.get!("FRONTEND_ORIGIN", default: "https://#{hostname}:3000")
content_origin = Env.get("BUCKET_CONTENT_ORIGIN")
uploads_origin = Env.get("BUCKET_UPLOADS_ORIGIN")

config :flirtual,
  origin: origin,
  frontend_origin: URI.parse(frontend_origin),
  cookie_origin: URI.parse(Env.get("ROOT_ORIGIN", default: frontend_origin)),
  content_origin: content_origin && URI.parse(content_origin),
  uploads_origin: uploads_origin && URI.parse(uploads_origin)

config :flirtual, FlirtualWeb.Endpoint,
  secret_key_base:
    Env.get!(
      "SECRET_KEY_BASE",
      default:
        "local_1TGGlvHyCZNDDLHq2HEwlFhrNZ519f0XT8MHIqAE4UcbdMEuHz0zr5zo0thFfbsTrFmkZ5G955hEau2jAA"
    ),
  live_view: [signing_salt: Env.get!("LIVE_VIEW_SIGNING_SALT", default: "local_gwbAO9QRWu")],
  url: [host: origin.host, port: origin.port]

config :flirtual, FlirtualWeb.Session,
  same_site: if(dev?, do: "None", else: "Lax"),
  secure: origin.scheme == "https"

local_uploads? = is_nil(Env.get("R2_HOSTNAME"))

local_uploads_dir =
  if local_uploads? do
    Env.get("LOCAL_UPLOADS_DIR",
      default: :code.priv_dir(:flirtual) |> to_string() |> Path.join("uploads")
    )
  end

config :flirtual,
  local_uploads?: local_uploads?,
  local_uploads_dir: local_uploads_dir

unless local_uploads? do
  config :ex_aws,
    access_key_id: Env.get!("R2_ACCESS_KEY_ID", always?: true),
    secret_access_key: Env.get!("R2_SECRET_ACCESS_KEY", always?: true),
    s3: [host: Env.get!("R2_HOSTNAME"), region: "auto"]
end

discord_client_id = Env.get("DISCORD_CLIENT_ID")

if discord_client_id do
  config :flirtual, Flirtual.Discord,
    client_id: discord_client_id,
    client_secret: Env.get!("DISCORD_CLIENT_SECRET", always?: true),
    access_token: Env.get!("DISCORD_ACCESS_TOKEN", always?: true)
end

config :flirtual, Flirtual.Discord,
  webhook_moderation_reports: Env.get("DISCORD_WEBHOOK_MODERATION_REPORTS"),
  webhook_moderation_flags: Env.get("DISCORD_WEBHOOK_MODERATION_FLAGS"),
  webhook_moderation_duplicates: Env.get("DISCORD_WEBHOOK_MODERATION_DUPLICATES"),
  webhook_moderation_pics: Env.get("DISCORD_WEBHOOK_MODERATION_PICS"),
  webhook_moderation_actions: Env.get("DISCORD_WEBHOOK_MODERATION_ACTIONS"),
  webhook_moderation_acknowledgements: Env.get("DISCORD_WEBHOOK_MODERATION_ACKNOWLEDGEMENTS"),
  webhook_admin: Env.get("DISCORD_WEBHOOK_ADMIN")

config :flirtual, Flirtual.Apple,
  client_id: System.fetch_env!("APPLE_CLIENT_ID"),
  client_secret: System.fetch_env!("APPLE_CLIENT_SECRET")

config :flirtual, Flirtual.VRChat,
  username: Env.get!("VRCHAT_USERNAME"),
  password: Env.get!("VRCHAT_PASSWORD"),
  totp_secret: Env.get!("VRCHAT_TOTP_SECRET")

config :wax_,
  origin: frontend_origin,
  rp_id: :auto

config :joken,
  default_signer: Env.get!("JOKEN_SECRET", default: "local_Ru3m3hN7uAxO2snCb030SDyzDyR")

config :flirtual, Flirtual.APNS,
  adapter: Pigeon.APNS,
  key: System.fetch_env!("APNS_KEY"),
  key_identifier: System.fetch_env!("APNS_KEY_ID"),
  team_id: System.fetch_env!("APNS_TEAM_ID"),
  topic: System.fetch_env!("APNS_TOPIC"),
  mode: if(config_env() == :prod, do: :prod, else: :dev)

config :flirtual, Flirtual.FCM,
  adapter: Pigeon.FCM,
  project_id: Env.get!("FCM_PROJECT_ID"),
  auth: Flirtual.Goth

config :flirtual, Flirtual.Talkjs,
  app_id: Env.get!("TALKJS_APP_ID"),
  access_token: Env.get!("TALKJS_ACCESS_TOKEN")

config :flirtual, Flirtual.Turnstile,
  app_id: Env.get!("TURNSTILE_APP_ID"),
  # Cloudflare's "always passes" testing secret keeps registration usable in dev.
  # https://developers.cloudflare.com/turnstile/troubleshooting/testing/#test-secret-keys
  access_token: Env.get!("TURNSTILE_ACCESS_TOKEN", default: "1x0000000000000000000000000000000AA")

config :flirtual, Flirtual.Listmonk,
  url: Env.get!("LISTMONK_URL"),
  username: Env.get!("LISTMONK_USERNAME"),
  password: Env.get!("LISTMONK_PASSWORD")

config :chargebeex,
  namespace: Env.get!("CHARGEBEE_NAMESPACE"),
  api_key: Env.get!("CHARGEBEE_ACCESS_TOKEN")

config :flirtual, FlirtualWeb.ChargebeeController,
  signing_secret: Env.get!("CHARGEBEE_SIGNING_SECRET")

config :flirtual, FlirtualWeb.RevenueCatController,
  api_key: Env.get!("REVENUECAT_ACCESS_TOKEN"),
  apple_key: Env.get!("REVENUECAT_APPLE_KEY"),
  google_key: Env.get!("REVENUECAT_GOOGLE_KEY"),
  signing_secret: Env.get!("REVENUECAT_SIGNING_SECRET")

config :openai,
  organization_key: Env.get!("OPENAI_ORG_ID"),
  api_key: Env.get!("OPENAI_ACCESS_TOKEN")

config :flirtual, Flirtual.ObanWorkers,
  enabled_workers:
    if(prod?,
      do: [:chargebee, :elasticsearch, :listmonk, :refresh_prospects, :talkjs],
      else: [:elasticsearch, :refresh_prospects]
    ),
  enabled_cron_tasks:
    if(prod?,
      do: [
        :like_digest,
        :update_disposable,
        :prune_sessions,
        :prune_banned,
        :prune_inactive,
        :update_attribute_order
      ],
      else: [
        :like_digest,
        :update_disposable,
        :prune_sessions,
        :update_attribute_order
      ]
    ),
  email_rate_limit: Env.get!("EMAIL_RATE_LIMIT", default: "1") |> String.to_integer()

config :flirtual, Oban,
  queues: [
    default: Env.get("OBAN_DEFAULT_CONCURRENCY", default: "6") |> String.to_integer(),
    notifications: Env.get("OBAN_NOTIFICATIONS_CONCURRENCY", default: "3") |> String.to_integer()
  ]

if prod? do
  app_name =
    Env.get("FLY_APP_NAME") ||
      raise "FLY_APP_NAME not available"

  config :libcluster,
    topologies: [
      fly6pn: [
        strategy: Cluster.Strategy.DNSPoll,
        config: [
          polling_interval: 5_000,
          query: "#{app_name}.internal",
          node_basename: app_name
        ]
      ]
    ]

  config :flirtual, Flirtual.Repo,
    url: Env.get!("DATABASE_URL"),
    pool_size: String.to_integer(Env.get("POOL_SIZE", default: "10")),
    queue_target: String.to_integer(Env.get("QUEUE_TARGET", default: "50")),
    queue_interval: String.to_integer(Env.get("QUEUE_INTERVAL", default: "1000")),
    socket_options: if(Env.get("ECTO_IPV6"), do: [:inet6], else: [])

  config :flirtual, Flirtual.Elasticsearch,
    url: Env.get!("ELASTICSEARCH_URL"),
    index_namespace: Env.get("ELASTICSEARCH_INDEX_PREFIX"),
    auth: Flirtual.Elasticsearch.Auth,
    access_token: Env.get!("ELASTICSEARCH_ACCESS_TOKEN")

  config :flirtual, Flirtual.Mailer,
    adapter: Swoosh.Adapters.AmazonSES,
    region: Env.get!("SES_REGION"),
    access_key: Env.get!("SES_ACCESS_KEY"),
    secret: Env.get!("SES_SECRET")

  config :swoosh, :api_client, Swoosh.ApiClient.Finch
end

telemetry? = Env.bool("TELEMETRY", default: true)

config :flirtual, telemetry?: telemetry?

config :opentelemetry, traces_exporter: :none

config :sentry, dsn: nil

sentry_dsn = telemetry? && Env.get("SENTRY_DSN")

if sentry_dsn do
  {traces_sample_rate, _} = Float.parse(Env.get("SENTRY_TRACES", default: "0.1"))
  enable_logs? = Env.bool("SENTRY_LOGS", default: true)

  config :sentry,
    dsn: sentry_dsn,
    environment_name: environment_name,
    release: Env.get("GIT_COMMIT_SHA"),
    traces_sample_rate: traces_sample_rate,
    enable_logs: enable_logs?,
    integrations: [
      oban: [
        capture_errors: true,
        cron: [enabled: true]
      ]
    ]

  config :opentelemetry,
    span_processor: {Sentry.OpenTelemetry.SpanProcessor, []},
    sampler: {Flirtual.OpenTelemetry.Sampler, []},
    text_map_propagators: [
      :trace_context,
      :baggage,
      Sentry.OpenTelemetry.Propagator
    ]
end

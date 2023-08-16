import Config

# config/runtime.exs is executed for all environments, including
# during releases. It is executed after compilation and before the
# system starts, so it is typically used to load production configuration
# and secrets from environment variables or elsewhere. Do not define
# any compile-time configuration in here, as it won't be applied.
# The block below contains prod specific runtime configuration.

# Start the phoenix server if environment is set and running in a release
if System.get_env("PHX_SERVER") && System.get_env("RELEASE_NAME") do
  config :flirtual, FlirtualWeb.Endpoint, server: true
end

config :flirtual, Flirtual.Discord,
  client_id: System.fetch_env!("DISCORD_CLIENT_ID"),
  client_secret: System.fetch_env!("DISCORD_CLIENT_SECRET"),
  access_token: System.fetch_env!("DISCORD_ACCESS_TOKEN"),
  webhook_moderation_reports: System.fetch_env!("DISCORD_WEBHOOK_MODERATION_REPORTS"),
  webhook_moderation_flags: System.fetch_env!("DISCORD_WEBHOOK_MODERATION_FLAGS"),
  webhook_moderation_pics: System.fetch_env!("DISCORD_WEBHOOK_MODERATION_PICS"),
  webhook_moderation_actions: System.fetch_env!("DISCORD_WEBHOOK_MODERATION_ACTIONS"),
  webhook_admin: System.fetch_env!("DISCORD_WEBHOOK_ADMIN")

config :flirtual, Flirtual.Talkjs,
  app_id: System.fetch_env!("TALKJS_APP_ID"),
  access_token: System.fetch_env!("TALKJS_ACCESS_TOKEN")

config :flirtual, Flirtual.HCaptcha,
  app_id: System.fetch_env!("HCAPTCHA_APP_ID"),
  access_token: System.fetch_env!("HCAPTCHA_ACCESS_TOKEN")

config :flirtual, Flirtual.Canny, access_token: System.fetch_env!("CANNY_SECRET")

config :flirtual, Flirtual.Listmonk,
  url: System.fetch_env!("LISTMONK_URL"),
  username: System.fetch_env!("LISTMONK_USERNAME"),
  password: System.fetch_env!("LISTMONK_PASSWORD")

config :joken, default_signer: System.fetch_env!("JOKEN_SECRET")

config :stripity_stripe,
  api_key: System.fetch_env!("STRIPE_ACCESS_TOKEN"),
  signing_secret: System.fetch_env!("STRIPE_SIGNING_SECRET"),
  json_library: Poison

config :flirtual, FlirtualWeb.RevenueCatController,
  signing_secret: System.fetch_env!("REVENUECAT_SIGNING_SECRET")

config :openai,
  organization_key: System.fetch_env!("OPENAI_ORG_ID"),
  api_key: System.fetch_env!("OPENAI_ACCESS_TOKEN")

origin = URI.parse(System.fetch_env!("ORIGIN"))

config :flirtual,
  root_origin: URI.parse(System.fetch_env!("ROOT_ORIGIN")),
  frontend_origin: URI.parse(System.fetch_env!("FRONTEND_ORIGIN")),
  origin: origin,
  session_signing_salt: System.fetch_env!("SESSION_SIGNING_SALT"),
  scan_queue_access_token: System.fetch_env!("SCAN_QUEUE_ACCESS_TOKEN")

config :flirtual, FlirtualWeb.Endpoint,
  secret_key_base: System.fetch_env!("SECRET_KEY_BASE"),
  url: [
    host: origin.host,
    port: origin.port
  ]

config :sentry,
  dsn: System.fetch_env!("SENTRY_DSN")

if config_env() == :prod do
  app_name =
    System.get_env("FLY_APP_NAME") ||
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
    # ssl: true,
    url: System.fetch_env!("DATABASE_URL"),
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    socket_options: if(System.get_env("ECTO_IPV6"), do: [:inet6], else: [])

  config :flirtual, Flirtual.Elasticsearch,
    url: System.fetch_env!("ELASTICSEARCH_URL"),
    default_headers: [
      {"authorization", "ApiKey " <> System.fetch_env!("ELASTICSEARCH_ACCESS_TOKEN")}
    ]

  # Configuring the mailer
  config :flirtual, Flirtual.Mailer,
    adapter: Swoosh.Adapters.SMTP,
    relay: System.fetch_env!("SMTP_RELAY"),
    username: System.fetch_env!("SMTP_USERNAME"),
    password: System.fetch_env!("SMTP_PASSWORD"),
    tls: :always,
    port: 587

  config :swoosh, :api_client, Swoosh.ApiClient.Finch
end

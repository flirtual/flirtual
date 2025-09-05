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

canary = System.get_env("CANARY", "") === "1"

config :flirtual, Flirtual.ObanWorkers,
  enabled_workers:
    if(config_env() == :prod,
      do: [:chargebee, :elasticsearch, :listmonk, :premium_reset, :talkjs],
      else: [:elasticsearch, :premium_reset]
    ),
  enabled_cron_tasks:
    if(config_env() == :prod,
      do: [:like_digest, :prune_banned],
      else: [:like_digest]
    ),
  email_rate_limit: System.fetch_env!("EMAIL_RATE_LIMIT") |> String.to_integer()

config :flirtual, Flirtual.Discord,
  client_id: System.fetch_env!("DISCORD_CLIENT_ID"),
  client_secret: System.fetch_env!("DISCORD_CLIENT_SECRET"),
  access_token: System.fetch_env!("DISCORD_ACCESS_TOKEN"),
  webhook_moderation_reports: System.fetch_env!("DISCORD_WEBHOOK_MODERATION_REPORTS"),
  webhook_moderation_flags: System.fetch_env!("DISCORD_WEBHOOK_MODERATION_FLAGS"),
  webhook_moderation_duplicates: System.fetch_env!("DISCORD_WEBHOOK_MODERATION_DUPLICATES"),
  webhook_moderation_pics: System.fetch_env!("DISCORD_WEBHOOK_MODERATION_PICS"),
  webhook_moderation_actions: System.fetch_env!("DISCORD_WEBHOOK_MODERATION_ACTIONS"),
  webhook_moderation_acknowledgements:
    System.fetch_env!("DISCORD_WEBHOOK_MODERATION_ACKNOWLEDGEMENTS"),
  webhook_admin: System.fetch_env!("DISCORD_WEBHOOK_ADMIN")

config :flirtual, Flirtual.Apple,
  client_id: System.fetch_env!("APPLE_CLIENT_ID"),
  client_secret: System.fetch_env!("APPLE_CLIENT_SECRET")

config :flirtual, Flirtual.VRChat,
  username: System.fetch_env!("VRCHAT_USERNAME"),
  password: System.fetch_env!("VRCHAT_PASSWORD"),
  totp_secret: System.fetch_env!("VRCHAT_TOTP_SECRET")

config :wax_,
  origin: System.fetch_env!("FRONTEND_ORIGIN"),
  rp_id: :auto

config :flirtual, Flirtual.Talkjs,
  app_id: System.fetch_env!("TALKJS_APP_ID"),
  access_token: System.fetch_env!("TALKJS_ACCESS_TOKEN")

config :flirtual, Flirtual.Turnstile,
  app_id: System.fetch_env!("TURNSTILE_APP_ID"),
  access_token: System.fetch_env!("TURNSTILE_ACCESS_TOKEN")

config :flirtual, Flirtual.Canny,
  company_id: System.fetch_env!("CANNY_COMPANY_ID"),
  access_token: System.fetch_env!("CANNY_SECRET")

config :flirtual, Flirtual.Listmonk,
  url: System.fetch_env!("LISTMONK_URL"),
  username: System.fetch_env!("LISTMONK_USERNAME"),
  password: System.fetch_env!("LISTMONK_PASSWORD")

config :flirtual, Flirtual.APNS,
  adapter: Pigeon.APNS,
  key: System.fetch_env!("APNS_KEY"),
  key_identifier: System.fetch_env!("APNS_KEY_ID"),
  team_id: System.fetch_env!("APNS_TEAM_ID"),
  topic: System.fetch_env!("APNS_TOPIC"),
  mode: if(config_env() == :prod, do: :prod, else: :dev)

config :flirtual, Flirtual.FCM,
  adapter: Pigeon.FCM,
  project_id: System.fetch_env!("FCM_PROJECT_ID"),
  auth: Flirtual.Goth

config :joken, default_signer: System.fetch_env!("JOKEN_SECRET")

config :ex_aws,
  access_key_id: System.fetch_env!("R2_ACCESS_KEY_ID"),
  secret_access_key: System.fetch_env!("R2_SECRET_ACCESS_KEY"),
  s3: [
    host: System.fetch_env!("R2_HOSTNAME"),
    region: "auto"
  ]

config :stripity_stripe,
  api_key: System.fetch_env!("STRIPE_ACCESS_TOKEN"),
  signing_secret: System.fetch_env!("STRIPE_SIGNING_SECRET"),
  json_library: Poison

config :chargebeex,
  namespace: System.fetch_env!("CHARGEBEE_NAMESPACE"),
  api_key: System.fetch_env!("CHARGEBEE_ACCESS_TOKEN")

config :flirtual, FlirtualWeb.ChargebeeController,
  signing_secret: System.fetch_env!("CHARGEBEE_SIGNING_SECRET")

config :flirtual, FlirtualWeb.RevenueCatController,
  api_key: System.fetch_env!("REVENUECAT_ACCESS_TOKEN"),
  apple_key: System.fetch_env!("REVENUECAT_APPLE_KEY"),
  google_key: System.fetch_env!("REVENUECAT_GOOGLE_KEY"),
  signing_secret: System.fetch_env!("REVENUECAT_SIGNING_SECRET")

config :openai,
  organization_key: System.fetch_env!("OPENAI_ORG_ID"),
  api_key: System.fetch_env!("OPENAI_ACCESS_TOKEN")

origin = URI.parse(System.fetch_env!("ORIGIN"))

config :flirtual,
  root_origin: URI.parse(System.fetch_env!("ROOT_ORIGIN")),
  frontend_origin: URI.parse(System.fetch_env!("FRONTEND_ORIGIN")),
  content_origin: URI.parse(System.fetch_env!("BUCKET_CONTENT_ORIGIN")),
  uploads_origin: URI.parse(System.fetch_env!("BUCKET_UPLOADS_ORIGIN")),
  origin: origin,
  session_signing_salt: System.fetch_env!("SESSION_SIGNING_SALT"),
  image_access_token: System.fetch_env!("IMAGE_ACCESS_TOKEN"),
  feedback_access_token: System.fetch_env!("FEEDBACK_ACCESS_TOKEN"),
  canary: canary

config :flirtual, FlirtualWeb.Endpoint,
  secret_key_base: System.fetch_env!("SECRET_KEY_BASE"),
  url: [
    host: origin.host,
    port: origin.port
  ]

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
    queue_target: String.to_integer(System.get_env("QUEUE_TARGET") || "50"),
    queue_interval: String.to_integer(System.get_env("QUEUE_INTERVAL") || "1000"),
    socket_options: if(System.get_env("ECTO_IPV6"), do: [:inet6], else: [])

  config :flirtual, Flirtual.Elasticsearch,
    url: System.fetch_env!("ELASTICSEARCH_URL"),
    index_prefix: System.get_env("ELASTICSEARCH_INDEX_PREFIX"),
    default_headers: [
      {"authorization", "ApiKey " <> System.fetch_env!("ELASTICSEARCH_ACCESS_TOKEN")}
    ]

  # Configuring the mailer
  config :flirtual, Flirtual.Mailer,
    adapter: Swoosh.Adapters.AmazonSES,
    region: System.fetch_env!("SES_REGION"),
    access_key: System.fetch_env!("SES_ACCESS_KEY"),
    secret: System.fetch_env!("SES_SECRET")

  config :swoosh, :api_client, Swoosh.ApiClient.Finch

  config :sentry,
    dsn: System.fetch_env!("SENTRY_DSN"),
    environment_name: if(canary, do: :canary, else: :production),
    release: System.get_env("GIT_COMMIT_SHA")
end

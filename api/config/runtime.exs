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

config :flirtual,
  discord_client_id: System.fetch_env!("DISCORD_CLIENT_ID"),
  discord_client_secret: System.fetch_env!("DISCORD_CLIENT_SECRET"),
  discord_access_token: System.fetch_env!("DISCORD_ACCESS_TOKEN")

config :flirtual, Flirtual.Talkjs,
  app_id: System.fetch_env!("TALKJS_APP_ID"),
  access_token: System.fetch_env!("TALKJS_ACCESS_TOKEN")

config :flirtual, Flirtual.HCaptcha,
  app_id: System.fetch_env!("HCAPTCHA_APP_ID"),
  access_token: System.fetch_env!("HCAPTCHA_ACCESS_TOKEN")

config :joken, default_signer: System.fetch_env!("JOKAN_SECRET")

config :flirtual, Flirtual.Elasticsearch,
  url: System.fetch_env!("ELASTICSEARCH_URL"),
  index_prefix: System.get_env("ELASTICSEARCH_INDEX_PREFIX", ""),
  default_headers: [
    {"authorization", "ApiKey " <> System.fetch_env!("ELASTICSEARCH_ACCESS_TOKEN")}
  ]

config :flirtual, FlirtualWeb.Endpoint, secret_key_base: System.fetch_env!("SECRET_KEY_BASE")

if config_env() == :prod do
  config :flirtual, Flirtual.Repo,
    # ssl: true,
    url: System.fetch_env!("DATABASE_URL"),
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    socket_options: if(System.get_env("ECTO_IPV6"), do: [:inet6], else: [])

  config :flirtual, Flirtual.Elastic,
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

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
  hostname: System.fetch_env!("HOSTNAME"),
  root_hostname: System.get_env("ROOT_HOSTNAME", System.fetch_env!("HOSTNAME")),
  frontend_origin: System.fetch_env!("TALKJS_APP_ID"),
  discord_client_id: System.fetch_env!("DISCORD_CLIENT_ID"),
  discord_client_secret: System.fetch_env!("DISCORD_CLIENT_SECRET"),
  discord_access_token: System.fetch_env!("DISCORD_CLIENT_ACCESS_TOKEN")

config :flirtual, Flirtual.Talkjs,
  app_id: System.fetch_env!("TALKJS_APP_ID"),
  access_token: System.fetch_env!("TALKJS_ACCESS_TOKEN")

config :joken, default_signer: System.fetch_env!("JOKAN_SECRET")

config :flirtual, Flirtual.Elastic,
  url: System.fetch_env!("ELASTICSEARCH_URL"),
  default_headers: [
    {"authorization", "ApiKey " <> System.fetch_env!("ELASTICSEARCH_ACCESS_TOKEN")}
  ]

config :flirtual, FlirtualWeb.Endpoint,
  url: [
    host: System.fetch_env!("HOSTNAME"),
  ],
  http: [
    port: String.to_integer(System.fetch_env!("PORT"))
  ],
  secret_key_base: System.fetch_env!("SECRET_KEY_BASE"),
  session_signing_salt: System.fetch_env!("SESSION_SIGNING_SALT")

if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      For example: ecto://USER:PASS@HOST/DATABASE
      """

  maybe_ipv6 = if System.get_env("ECTO_IPV6"), do: [:inet6], else: []

  config :flirtual, Flirtual.Repo,
    # ssl: true,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    socket_options: maybe_ipv6

  config :flirtual, Flirtual.Elastic,
    url: System.fetch_env!("ELASTICSEARCH_URL"),
    default_headers: [
      {"authorization", "ApiKey " <> System.fetch_env!("ELASTICSEARCH_ACCESS_TOKEN")}
    ]

  config :flirtual, FlirtualWeb.Endpoint,
    url: [port: 443],
    http: [
      # Enable IPv6 and bind on all interfaces.
      # Set it to  {0, 0, 0, 0, 0, 0, 0, 1} for local network only access.
      # See the documentation on https://hexdocs.pm/plug_cowboy/Plug.Cowboy.html
      # for details about using IPv6 vs IPv4 and loopback vs public addresses.
      ip: {0, 0, 0, 0, 0, 0, 0, 0},
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

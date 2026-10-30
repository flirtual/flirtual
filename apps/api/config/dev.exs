import Config

config :flirtual,
  prohibit_leaked_passwords: false

# Configure your database
config :flirtual, Flirtual.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "flirtual_dev",
  show_sensitive_data_on_connection_error: true,
  pool_size: 20,
  queue_target: 15_000,
  queue_interval: 5000

# Configures the mailer
#
# By default it uses the "Local" adapter which stores the emails
# locally. You can see the emails in your browser, at "/dev/mailbox".
#
# For production it's recommended to configure a different adapter
# at the `config/runtime.exs`.
config :flirtual, Flirtual.Mailer, adapter: Swoosh.Adapters.Local

# Swoosh API client is needed for adapters other than SMTP.
config :swoosh, :api_client, false

# For development, we disable any cache and enable
# debugging and code reloading.
config :flirtual, FlirtualWeb.Endpoint,
  # Every address, IPv6 and IPv4: a hostname can resolve to IPv6 first, as WSL's mirrored
  # networking makes it.
  http: [
    ip: {0, 0, 0, 0, 0, 0, 0, 0}
  ],
  https: [
    ip: {0, 0, 0, 0, 0, 0, 0, 0},
    otp_app: :flirtual,
    port: 4001,
    cipher_suite: :strong,
    certfile: "priv/cert/selfsigned.pem",
    keyfile: "priv/cert/selfsigned_key.pem"
  ],
  check_origin: false,
  code_reloader: true,
  watchers: []

config :phoenix,
  # Set a higher stacktrace during development. Avoid configuring such
  # in production as building large stacktraces may be expensive.
  stacktrace_depth: 10,
  # Initialize plugs at runtime for faster development compilation
  plug_init_mode: :runtime

config :logger, level: :info

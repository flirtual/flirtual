import Config

# Configure your database
config :flirtual, Flirtual.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "flirtual_dev",
  show_sensitive_data_on_connection_error: true,
  pool_size: 200,
  queue_target: 15000,
  queue_interval: 5000

config :flirtual, Flirtual.Elasticsearch, url: "http://localhost:9200"

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
  # Binding to loopback ipv4 address prevents access from other machines.
  # Change to `ip: {0, 0, 0, 0}` to allow access from other machines.
  http: [
    ip: {0, 0, 0, 0},
    protocol_options: [
      idle_timeout: :infinity
    ]
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

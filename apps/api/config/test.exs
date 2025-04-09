import Config

# Only in tests, remove the complexity from the password hashing algorithm
config :bcrypt_elixir, :log_rounds, 1

# Configure your database
#
# The MIX_TEST_PARTITION environment variable can be used
# to provide built-in test partitioning in CI environment.
# Run `mix help test` for more information.
config :flirtual, Flirtual.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "flirtual_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: 10

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :flirtual, FlirtualWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "qSuvZaUX+Ee+Kz2HLGE8XMsQikWf2uYBENL06Dtb93pis6eTRJBogpw3Ebr7s6l3",
  server: false

# In tests we don't run Oban jobs
config :flirtual, Oban, testing: :inline

# In test we don't send emails.
config :flirtual, Flirtual.Mailer, adapter: Swoosh.Adapters.Test

# Print only warnings and errors during test
config :logger, level: :warn

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime

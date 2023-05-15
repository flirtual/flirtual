# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :flirtual,
  ecto_repos: [Flirtual.Repo]

# Configures the endpoint
config :flirtual, FlirtualWeb.Endpoint,
  pubsub_server: Flirtual.PubSub,
  http: [
    port: 4000
  ],
  render_errors: [
    view: FlirtualWeb.ErrorView,
    formats: "json",
    accepts: ~w(json)
  ]

config :flirtual, Flirtual.Elasticsearch,
  api: Elasticsearch.API.HTTP,
  json_library: Jason,
  indexes: %{
    users_new: %{
      settings: "priv/elasticsearch/users.json",
      store: Flirtual.Elasticsearch.Store,
      sources: [Flirtual.User],
      bulk_page_size: 5000,
      bulk_wait_interval: 15_000
    }
  }

config :bodyguard,
  default_error: {:unauthorized, "Unauthorized"}

config :logger, :console,
  format: "level=$level $metadata\n$message\n\n",
  metadata: [:request_id]

config :phoenix,
  # Use Jason for JSON parsing in Phoenix
  json_library: Jason

config :pre_commit,
  commands: ["check --fix"]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"

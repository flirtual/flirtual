# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :flirtual,
  ecto_repos: [Flirtual.Repo]

config :tesla, VRChat.Connection, adapter: {Tesla.Adapter.Finch, name: Flirtual.Finch}

# Configures the endpoint
config :flirtual, FlirtualWeb.Endpoint,
  adapter: Bandit.PhoenixAdapter,
  pubsub_server: Flirtual.PubSub,
  http: [
    port: 4000
  ],
  render_errors: [
    view: FlirtualWeb.ErrorView,
    accepts: ~w(json),
    layout: false
  ]

# render_errors: [
#   view: FlirtualWeb.ErrorView,
#   formats: "json",
#   accepts: ~w(json)
# ]

config :flirtual, Flirtual.Repo, telemetry_prefix: [:flirtual, :repo]

config :flirtual, Oban,
  repo: Flirtual.Repo,
  notifier: Oban.Notifiers.PG,
  plugins: [
    {Oban.Plugins.Pruner, max_age: 60 * 60 * 24 * 7},
    {Oban.Plugins.Lifeline, rescue_after: :timer.minutes(30)},
    {Oban.Plugins.Cron,
     crontab: [
       {"@daily", Flirtual.ObanWorkers.Daily},
       {"0 18 * * SAT", Flirtual.ObanWorkers.Weekly}
     ]}
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

config :elixir, :time_zone_database, Tz.TimeZoneDatabase

config :floki, :html_parser, Floki.HTMLParser.FastHtml

config :bodyguard,
  default_error: {:unauthorized, "Unauthorized"}

config :sentry,
  enable_source_code_context: true,
  root_source_code_paths: [File.cwd!()],
  logs: [
    level: :info,
    metadata: :all
  ]

config :logger, :console,
  format: "level=$level $metadata\n$message\n\n",
  metadata: [:request_id, :trace_id, :span_id]

config :logger,
  handle_otp_reports: true,
  handle_sasl_reports: true

config :phoenix,
  # Use Jason for JSON parsing in Phoenix
  json_library: Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"

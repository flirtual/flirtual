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
    port: 4000,
    http_1_options: [max_header_length: 20_000, max_header_count: 100],
    http_2_options: [max_header_block_size: 100_000]
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
  # Only affects promotion of scheduled/retryable jobs; immediately-enqueued
  # jobs dispatch via insert triggers, so this interval doesn't delay them.
  # https://hexdocs.pm/oban/scaling.html#triggers
  stage_interval: :timer.seconds(5),
  plugins: [
    # Short retention is safe here: the completed-state unique jobs are all
    # cron-cadence, so their dedup window never reaches back this far.
    # https://hexdocs.pm/oban/scaling.html#pruning
    {Oban.Plugins.Pruner, max_age: 60 * 60 * 24 * 2},
    {Oban.Plugins.Lifeline, rescue_after: :timer.minutes(30)},
    {Oban.Plugins.Reindexer, schedule: "@weekly"},
    {Oban.Plugins.Cron,
     crontab: [
       {"@daily", Flirtual.ObanWorkers.Daily},
       {"0 18 * * SAT", Flirtual.ObanWorkers.Weekly}
     ]}
  ]

# Oban Web's metrics reporter counts jobs every second by default. 5s is ample
# for the dashboard and cuts per-second aggregate queries over oban_jobs.
config :oban_met, :reporter, check_interval: :timer.seconds(5)

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

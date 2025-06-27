defmodule Flirtual.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false
  require Logger

  use Application

  @impl true
  def start(_type, _args) do
    if System.get_env("ECTO_IPV6") do
      :httpc.set_option(:ipfamily, :inet6fb4)
    end

    topologies = Application.get_env(:libcluster, :topologies) || []

    Oban.Telemetry.attach_default_logger()
    Flirtual.ObanReporter.attach()

    OpentelemetryOban.setup()

    :ok = OpentelemetryBandit.setup()
    :ok = OpentelemetryPhoenix.setup(adapter: :bandit)

    :ok =
      Flirtual.Repo.config()
      |> Keyword.fetch!(:telemetry_prefix)
      |> OpentelemetryEcto.setup(db_statement: :enabled)

    children =
      [
        # Start the Cluster supervisor
        {Cluster.Supervisor, [topologies, [name: Flirtual.ClusterSupervisor]]},
        # Start the Ecto repository
        Flirtual.Repo,
        # Start Oban
        {Oban, Application.fetch_env!(:flirtual, Oban)},
        # Start Elasticsearch
        Flirtual.Elasticsearch,
        # Start the push notification dispatchers
        if(Application.get_env(:flirtual, Flirtual.APNS)[:key] in [nil, ""],
          do:
            Logger.warning("Flirtual.APNS not configured, excluding from supervision tree.") &&
              nil,
          else: Flirtual.APNS
        ),
        if(Application.get_env(:flirtual, Flirtual.FCM)[:project_id] in [nil, ""],
          do:
            Logger.warning("Flirtual.FCM not configured, excluding from supervision tree.") && nil,
          else: [{Goth, name: Flirtual.Goth}, Flirtual.FCM]
        ),
        # Start the Telemetry supervisor
        FlirtualWeb.Telemetry,
        # Start the PubSub system
        {Phoenix.PubSub, name: Flirtual.PubSub},
        # Start the Endpoint (http/https)
        FlirtualWeb.Endpoint,
        {Finch, name: Swoosh.Finch},
        # Start a worker by calling: Flirtual.Worker.start_link(arg)
        # {Flirtual.Worker, arg}
        Flirtual.AttributeOrderWorker,
        # Start VRChat session manager
        Flirtual.VRChatSession
      ]
      |> List.flatten()
      |> Enum.reject(&is_nil/1)

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Flirtual.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    FlirtualWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end

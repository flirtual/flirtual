defmodule Flirtual.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    topologies = Application.get_env(:libcluster, :topologies) || []

    children = [
      # Start the Cluster supervisor
      {Cluster.Supervisor, [topologies, [name: Flirtual.ClusterSupervisor]]},
      # Start the RPC server
      {Fly.RPC, []},
      # Start the Ecto repository
      Flirtual.Repo.Local,
      # Start the supervisor for LSN tracking
      {Fly.Postgres.LSN.Supervisor, repo: Flirtual.Repo.Local},
      # Start Elasticsearch
      Flirtual.Elasticsearch,
      # Start the Telemetry supervisor
      FlirtualWeb.Telemetry,
      # Start the PubSub system
      {Phoenix.PubSub, name: Flirtual.PubSub},
      # Start the Endpoint (http/https)
      FlirtualWeb.Endpoint,
      {Finch, name: Swoosh.Finch},
      # Start a worker by calling: Flirtual.Worker.start_link(arg)
      # {Flirtual.Worker, arg}
      Flirtual.UserQueueWorker,
      Flirtual.AttributeOrderWorker
    ]

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

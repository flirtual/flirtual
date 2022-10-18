defmodule Flirtual.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      # Start the Ecto repository
      Flirtual.Repo,
      Flirtual.Elasticsearch,
      # Start the Telemetry supervisor
      FlirtualWeb.Telemetry,
      # Start the PubSub system
      {Phoenix.PubSub, name: Flirtual.PubSub},
      # Start the Endpoint (http/https)
      FlirtualWeb.Endpoint,
      {Finch, name: Swoosh.Finch}
      # Start a worker by calling: Flirtual.Worker.start_link(arg)
      # {Flirtual.Worker, arg}
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

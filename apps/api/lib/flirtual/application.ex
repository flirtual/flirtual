defmodule Flirtual.Application do
  @moduledoc false

  use Application
  require Logger

  @impl true
  def start(_type, _args) do
    configure_inet6()
    if config(:telemetry?), do: setup_observability()

    with {:ok, pid} <-
           Supervisor.start_link(children(), strategy: :one_for_one, name: Flirtual.Supervisor) do
      create_elasticsearch_index()
      {:ok, pid}
    end
  end

  @impl true
  def config_change(changed, _new, removed) do
    FlirtualWeb.Endpoint.config_change(changed, removed)
    :ok
  end

  def config(key), do: Application.get_env(:flirtual, key)

  defp configure_inet6 do
    if System.get_env("ECTO_IPV6"), do: :httpc.set_option(:ipfamily, :inet6fb4)
  end

  defp setup_observability() do
    Oban.Telemetry.attach_default_logger()
    Flirtual.ObanReporter.attach()

    OpentelemetryBandit.setup()
    OpentelemetryPhoenix.setup(adapter: :bandit)
    OpentelemetryEcto.setup([:flirtual, :repo], db_statement: :enabled)
    OpentelemetryOban.setup()
    OpentelemetryFinch.setup()
  end

  defp children do
    topologies = Application.get_env(:libcluster, :topologies) || []

    optional =
      [
        {
          config(:telemetry?),
          [FlirtualWeb.Telemetry]
        },
        {
          has_config?(Flirtual.VRChat, [:username, :password]),
          [Flirtual.VRChatSession]
        },
        {
          has_config?(Flirtual.APNS, [:key]),
          [Flirtual.APNS]
        },
        {
          has_config?(Flirtual.FCM, [:project_id]),
          [
            {Goth, name: Flirtual.Goth},
            Flirtual.FCM
          ]
        }
      ]
      |> Enum.flat_map(fn {start?, specs} -> if start?, do: specs, else: [] end)

    [
      {Cluster.Supervisor, [topologies, [name: Flirtual.ClusterSupervisor]]},
      Flirtual.Repo,
      {Oban, Application.fetch_env!(:flirtual, Oban)},
      Flirtual.Elasticsearch,
      {Phoenix.PubSub, name: Flirtual.PubSub},
      FlirtualWeb.Endpoint,
      {Finch, name: Swoosh.Finch},
      {Finch, name: Flirtual.Finch},
      Flirtual.Disposable
    ] ++ optional
  end

  defp has_config?(module, keys) do
    config = Application.get_env(:flirtual, module, [])
    Enum.all?(keys, &(config[&1] not in [nil, ""]))
  end

  defp create_elasticsearch_index do
    if Flirtual.Elasticsearch.index_exists?(:users) do
      :ok
    else
      case Flirtual.Elasticsearch.create_index(:users) do
        :ok ->
          Logger.info("Created Elasticsearch 'users' index.")

        {:error, reason} ->
          Logger.warning("Failed to create Elasticsearch 'users' index: #{inspect(reason)}")
      end
    end
  end
end

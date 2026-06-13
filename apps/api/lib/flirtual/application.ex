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
          [{0, FlirtualWeb.Telemetry}]
        },
        {
          has_config?(Flirtual.VRChat, [:username, :password]),
          [{2, Flirtual.VRChatSession}]
        },
        {
          has_config?(Flirtual.APNS, [:key]),
          [{2, Flirtual.APNS}]
        },
        {
          has_config?(Flirtual.FCM, [:project_id]),
          [{2, {Goth, name: Flirtual.Goth}}, {2, Flirtual.FCM}]
        }
      ]
      |> Enum.flat_map(fn {start?, specs} -> if start?, do: specs, else: [] end)

    ([
       {0, {Cluster.Supervisor, [topologies, [name: Flirtual.ClusterSupervisor]]}},
       {1, Flirtual.Repo},
       {2, {Finch, name: Swoosh.Finch}},
       {2, {Finch, name: Flirtual.Finch}},
       {2, Flirtual.Elasticsearch},
       {2, {Phoenix.PubSub, name: Flirtual.PubSub}},
       {2, Flirtual.Disposable},
       {3, FlirtualWeb.Endpoint},
       {9, {Oban, Application.fetch_env!(:flirtual, Oban)}}
     ] ++ optional)
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map(&elem(&1, 1))
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

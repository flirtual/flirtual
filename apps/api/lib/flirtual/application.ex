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
      Flirtual.Search.bootstrap()
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
    OpentelemetryEcto.setup([:flirtual, :search, :repo], db_statement: :enabled)
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
          not is_nil(config(:oban_pool_size)),
          [
            {1,
             Supervisor.child_spec(
               {Flirtual.Repo,
                name: Flirtual.Repo.oban_repo(), pool_size: config(:oban_pool_size)},
               id: Flirtual.Repo.oban_repo()
             )}
          ]
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
       {1, Flirtual.Search.Repo},
       {2, {Finch, name: Swoosh.Finch}},
       {2, {Finch, name: Flirtual.Finch}},
       {2,
        {Finch,
         name: Flirtual.FinchInternal,
         pools: %{default: [conn_opts: [transport_opts: [tcp_module: :inet6_tcp]]]}}},
       {2, {Phoenix.PubSub, name: Flirtual.PubSub}},
       {2, Flirtual.Attribute.Cache},
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
end

defmodule Flirtual.Attribute.Cache do
  use GenServer
  use Flirtual.Logger, :attribute_cache

  alias Flirtual.Attribute

  @table :attributes
  @topic "attribute:refresh"

  def start_link([]) do
    GenServer.start_link(__MODULE__, [], name: __MODULE__)
  end

  @impl true
  def init([]) do
    create_table()
    Phoenix.PubSub.subscribe(Flirtual.PubSub, @topic)

    refresh_table()

    {:ok, %{}}
  end

  def list(type) when is_binary(type) do
    case lookup({:list, type}) do
      {:ok, attributes} -> attributes
      :error -> compute(type) |> elem(0)
    end
  end

  # No recompute on a miss, unlike `list/1`: clients poll `/config` so
  # recomputing is expensive and an unversioned url still works.
  def digests do
    case lookup(:digests) do
      {:ok, digests} -> digests
      :error -> %{}
    end
  end

  # Tolerates a missing table so a restarting cache degrades instead of failing.
  defp lookup(key) do
    with false <- :ets.whereis(@table) == :undefined,
         [{_, value}] <- :ets.lookup(@table, key) do
      {:ok, value}
    else
      _ -> :error
    end
  end

  # Cluster-wide: each node has its own table, and a node still serving the old
  # list under a new digest would poison client caches.
  def refresh do
    Phoenix.PubSub.broadcast(Flirtual.PubSub, @topic, :refresh)
  end

  @impl true
  def handle_info(:refresh, state) do
    refresh_table()
    {:noreply, state}
  end

  defp refresh_table do
    digests =
      Map.new(Attribute.types(), fn type ->
        {attributes, digest} = compute(type)

        :ets.insert(@table, {{:list, type}, attributes})

        {type, digest}
      end)

    :ets.insert(@table, {:digests, digests})
    log(:debug, [:refresh], digests)

    :ok
  end

  defp compute(type) do
    attributes = Attribute.list(type: type) |> Attribute.compress()
    {attributes, digest_of(attributes)}
  end

  # Same derivation as the etag in FlirtualWeb.Utilities, so the two agree.
  defp digest_of(term), do: term |> :erlang.phash2() |> Integer.to_string(16)

  defp create_table do
    :ets.new(@table, [
      :set,
      :named_table,
      :public,
      read_concurrency: true
    ])
  end
end

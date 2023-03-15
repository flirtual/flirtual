defmodule Flirtual.Elasticsearch do
  use Elasticsearch.Cluster, otp_app: :flirtual
  require Logger

  def search(index, query) do
    Logger.warn("elasticsearch(#{index}/search):\n#{inspect(query, pretty: true)}")
    Elasticsearch.post(Flirtual.Elasticsearch, "/" <> index <> "/_search", query)
  end

  def recreate_index() do
    Elasticsearch.delete(Flirtual.Elasticsearch, "/users")

    Elasticsearch.Index.create_from_file(
      Flirtual.Elasticsearch,
      "users",
      "priv/elasticsearch/users.json"
    )
  end

  defp bulk_changes_body(changes) do
    (changes
     |> Enum.map(fn {type, id, document} ->
       [
         Map.put(%{}, type, %{"_id" => id}),
         case type do
           type when type in [:create, :index] -> document
           :update -> %{doc: document}
           :delete -> nil
         end
       ]
       |> Enum.filter(&(not is_nil(&1)))
     end)
     |> List.flatten()
     |> Enum.map(&Jason.encode!(&1))
     |> Enum.join("\n")) <> "\n"
  end

  def bulk(index, changes, limit \\ 100)
  def bulk(_, [], _), do: :ok

  def bulk(index, changes, limit) do
    Logger.warn("elasticsearch(#{index}/bulk):\n#{inspect(changes, pretty: true)}")

    changes
    |> Enum.chunk_every(limit)
    |> Enum.map(fn changes ->
      changes
      |> bulk_changes_body()
      |> then(fn body ->
        resp =
          Elasticsearch.post!(
            Flirtual.Elasticsearch,
            "/" <> index <> "/_bulk",
            body
          )

        if resp["errors"] do
          exception =
            Elasticsearch.Exception.exception(
              response:
                Enum.find_value(resp["items"], fn item ->
                  Map.values(item) |> Enum.find(&(not is_nil(&1["error"])))
                end)
            )

          Logger.error("elasticsearch(#{index}/bulk)\n#{inspect(exception, pretty: true)}")
          {:error, exception}
        else
          :ok
        end
      end)
    end)
    |> Enum.reduce(:ok, fn item, _ ->
      case item do
        {:error, _} -> item
        :ok -> :ok
      end
    end)
  end

  def get(index, id) do
    Logger.debug("elasticsearch(#{index}/get): #{id}")

    with {:ok, document} <-
           Elasticsearch.get(Flirtual.Elasticsearch, "/" <> index <> "/_doc/#{id}") do
      {:ok, document["_source"]}
    end
  end

  def exists?(index, id) do
    case get(index, id) do
      {:ok, _} -> true
      _ -> false
    end
  end

  def encode(item), do: Elasticsearch.Document.encode(item)
end

defmodule Flirtual.Elasticsearch.Store do
  @behaviour Elasticsearch.Store

  alias Flirtual.Repo

  @impl true
  def stream(schema) do
    Repo.stream(schema)
  end

  @impl true
  def transaction(fun) do
    {:ok, result} = Repo.transaction(fun, timeout: :infinity)
    result
  end
end

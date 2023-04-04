defmodule Flirtual.Elasticsearch do
  use Elasticsearch.Cluster, otp_app: :flirtual
  use Flirtual.Logger, :elasticsearch

  defp get_index_name(index) do
    index_prefix = Application.get_env(:flirtual, Flirtual.Elasticsearch)[:index_prefix]
    if(index_prefix, do: index_prefix <> "_" <> to_string(index), else: to_string(index))
  end

  def search(index, query) do
    index_name = get_index_name(index)
    log(:debug, [index_name, "search"], query)

    Elasticsearch.post(Flirtual.Elasticsearch, "/" <> index_name <> "/_search", query)
  end

  def delete_index(index) do
    index_name = get_index_name(index)
    log(:warn, [index_name, "delete-index"], nil)

    Elasticsearch.delete(Flirtual.Elasticsearch, "/" <> index_name)

    Elasticsearch.Index.create_from_file(
      Flirtual.Elasticsearch,
      index_name,
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
     |> Enum.map(&Poison.encode!(&1))
     |> Enum.join("\n")) <> "\n"
  end

  def bulk(index, changes, limit \\ 100)
  def bulk(_, [], _), do: :ok

  def bulk(index, changes, limit) do
    index_name = get_index_name(index)
    log(:debug, [index_name, "bulk"], changes)

    changes
    |> Enum.chunk_every(limit)
    |> Enum.map(fn changes ->
      changes
      |> bulk_changes_body()
      |> then(fn body ->
        resp =
          Elasticsearch.post!(
            Flirtual.Elasticsearch,
            "/" <> index_name <> "/_bulk",
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

          log(:error, [index_name, "bulk"], exception)
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

  def get(index, id) when is_binary(id) do
    index_name = get_index_name(index)
    log(:debug, [index_name, "get"], id)

    case Elasticsearch.get(Flirtual.Elasticsearch, "/" <> index_name <> "/_doc/#{id}") do
      {:ok, document} ->
        document["_source"]

      {:error, value} ->
        log(:error, [index_name, "get"], value)
        nil
    end
  end

  def get(_, []), do: []

  def get(index, ids) when is_list(ids) do
    index_name = get_index_name(index)
    log(:debug, [index_name, "get"], ids)

    case Elasticsearch.post(Flirtual.Elasticsearch, "/" <> index_name <> "/_mget", %{ids: ids}) do
      {:ok, response} ->
        response["docs"]
        |> Enum.map(
          &case &1 do
            %{"_source" => document} -> document
            _ -> nil
          end
        )

      {:error, value} ->
        log(:error, [index_name, "get"], value)
        nil
    end
  end

  def exists?(index, id) do
    not is_nil(get(index, id))
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

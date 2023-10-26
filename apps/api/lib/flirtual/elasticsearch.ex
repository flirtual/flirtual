defmodule Flirtual.Elasticsearch do
  use Elasticsearch.Cluster, otp_app: :flirtual
  use Flirtual.Logger, :elasticsearch

  defp get_index_name(index) when is_atom(index) do
    index_prefix = Application.get_env(:flirtual, Flirtual.Elasticsearch)[:index_prefix]
    if(index_prefix, do: index_prefix <> "_" <> to_string(index), else: to_string(index))
  end

  def search(index, query) when is_atom(index) do
    index_name = get_index_name(index)
    log(:debug, [index_name, "search"], query)

    Elasticsearch.post(Flirtual.Elasticsearch, "/" <> index_name <> "/_search", query)
  end

  # def recompute_user(user) do
  #   document = encode(user)
  #   document_exists? = exists?(:users, user.id)

  #   type =
  #     if(user.visible,
  #       do: if(document_exists?, do: :update, else: :create),
  #       else: :delete
  #     )

  #   case type do
  #     :create ->
  #       create(:users, user.id, document)

  #     :update ->
  #       update(:users, user.id, document)

  #     :delete ->
  #       delete(:users, user.id)
  #   end
  # end

  def delete_index(index) when is_atom(index) do
    index_name = get_index_name(index)
    log(:warning, [index_name, "delete-index"], nil)

    Elasticsearch.delete(Flirtual.Elasticsearch, "/" <> index_name)
  end

  def create_index(:users = index) do
    index_name = get_index_name(index)
    log(:warning, [index_name, "create-index"], nil)

    Elasticsearch.Index.create(
      Flirtual.Elasticsearch,
      index_name,
      %{
        "mappings" => %{
          "properties" => %{
            "id" => %{
              "type" => "keyword"
            },
            "dob" => %{
              "type" => "date"
            },
            "agemin" => %{
              "type" => "integer"
            },
            "agemax" => %{
              "type" => "integer"
            },
            "active_at" => %{
              "type" => "date"
            },
            "openness" => %{
              "type" => "byte"
            },
            "conscientiousness" => %{
              "type" => "byte"
            },
            "agreeableness:" => %{
              "type" => "byte"
            },
            "attributes" => %{
              "type" => "keyword"
            },
            "attributes_lf" => %{
              "type" => "keyword"
            },
            "custom_interests" => %{
              "type" => "keyword"
            },
            "country" => %{
              "type" => "keyword"
            },
            "monopoly" => %{
              "type" => "keyword"
            },
            "serious" => %{
              "type" => "boolean"
            },
            "domsub" => %{
              "type" => "keyword"
            },
            "liked" => %{
              "type" => "keyword"
            },
            "passed" => %{
              "type" => "keyword"
            },
            "blocked" => %{
              "type" => "keyword"
            }
          }
        }
      }
    )
  end

  def recreate_index(index) when is_atom(index) do
    index_name = get_index_name(index)
    log(:warning, [index_name, "recreate-index"], nil)

    delete_index(index)
    create_index(index)
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
     |> Enum.map_join("\n", &Poison.encode!(&1))) <> "\n"
  end

  def bulk(index, changes, limit \\ 100)
  def bulk(_, [], _), do: :ok

  def bulk(index, changes, limit)
      when is_atom(index) and is_list(changes) and is_integer(limit) do
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

  def get(index, id) when is_atom(index) and is_binary(id) do
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

  def get(index, ids) when is_atom(index) and is_list(ids) do
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

  def exists?(index, id) when is_atom(index) do
    not is_nil(get(index, id))
  end

  def delete(index, id) when is_atom(index) and is_binary(id) do
    with {:ok, _} <-
           Elasticsearch.delete(
             Flirtual.Elasticsearch,
             "/" <> get_index_name(index) <> "/_doc/#{id}"
           ) do
      :ok
    else
      {:error, %Elasticsearch.Exception{type: "not_found"}} ->
        :ok

      reason ->
        reason
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

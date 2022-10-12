defmodule Flirtual.Elasticsearch do
  use Elasticsearch.Cluster, otp_app: :flirtual

  def dev_seed do
    Elasticsearch.delete!(Flirtual.Elasticsearch, "/users")
    Elasticsearch.Index.create_from_file(Flirtual.Elasticsearch, "users", "priv/elasticsearch/users.json")
    users = File.read!("priv/elasticsearch/out.json") |> Jason.decode!

    for user <- users do
      Elasticsearch.put!(Flirtual.Elasticsearch, "/users/_doc/#{Map.get(user, "id")}", Map.drop(user, [:id]))
    end
  end

  def get_user(id) do
    Elasticsearch.get!(Flirtual.Elasticsearch, "/users/_doc/#{id}")["_source"]
  end
end

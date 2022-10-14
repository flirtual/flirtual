defmodule Flirtual.Elasticsearch do
  use Elasticsearch.Cluster, otp_app: :flirtual

  def dev_seed do
    Elasticsearch.delete(Flirtual.Elasticsearch, "/users")

    IO.inspect(
      Elasticsearch.Index.create_from_file(
        Flirtual.Elasticsearch,
        "users",
        "priv/elasticsearch/users.json"
      )
    )

    users =
      File.read!("priv/elasticsearch/out.json")
      |> Jason.decode!()
      |> Enum.chunk_every(500)

    for chunk <- users do
      body =
        (Enum.map(chunk, &[%{"create" => %{"_id" => &1["id"]}}, &1])
         |> List.flatten()
         |> Enum.map(&Jason.encode!(&1))
         |> Enum.join("\n")) <> "\n"

      Elasticsearch.post!(
        Flirtual.Elasticsearch,
        "/users/_bulk",
        body
      )
    end
  end

  def get_user(id) do
    Elasticsearch.get!(Flirtual.Elasticsearch, "/users/_doc/#{id}")["_source"]
  end
end

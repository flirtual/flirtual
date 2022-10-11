defmodule FlirtualWeb.ElasticsearchController do
  use FlirtualWeb, :controller


  def get(conn, params) do
    # Flirtual.Elasticsearch.dev_seed()

    matches = Flirtual.Matchmaking.compute_potential_matches(Map.get(params, "id"))
    json(conn, matches)
  end
end

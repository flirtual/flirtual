defmodule FlirtualWeb.MatchmakingController do
  use FlirtualWeb, :controller

  def compute(conn, %{"id" => id}) do
    # Flirtual.Elasticsearch.dev_seed()

    matches = Flirtual.Matchmaking.compute_potential_matches(id)
    json(conn, matches)
  end

  def update(conn, %{"id" => id}) do
    result = Flirtual.Matchmaking.patch_user(id, conn.body_params)
    json(conn, result)
  end
end

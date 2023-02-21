defmodule FlirtualWeb.MatchmakingController do
  use FlirtualWeb, :controller

  def list_prospects(conn, _) do
    conn |> json(Flirtual.Matchmaking.compute_prospects(conn.assigns[:session].user))
  end

  def inspect_query(conn, _) do
    conn |> json(Flirtual.Matchmaking.generate_query(conn.assigns[:session].user))
  end
end

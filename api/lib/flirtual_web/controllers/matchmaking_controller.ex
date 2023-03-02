defmodule FlirtualWeb.MatchmakingController do
  use FlirtualWeb, :controller

  action_fallback FlirtualWeb.FallbackController

  import Flirtual.Utilities
  alias Flirtual.{Users, Policy}
  import Flirtual.Matchmaking

  def list_prospects(conn, _) do
    conn |> json(compute_prospects(conn.assigns[:session].user))
  end

  def inspect_query(conn, _) do
    conn |> json(generate_query(conn.assigns[:session].user))
  end

  def respond(conn, %{"user_id" => user_id, "type" => type}) when type in ["like", "pass"] do
    source_user = conn.assigns[:session].user
    target_user = Users.get(user_id)

    if is_nil(target_user) or Policy.cannot?(conn, :read, target_user) do
      {:error, {:not_found, "User not found", %{user_id: user_id}}}
    else
      with {:ok, _} <- respond_profile(source_user, target_user, to_atom(type)) do
        conn |> json(%{})
      end
    end
  end

  def respond(_, %{"user_id" => _, "type" => _}) do
    {:error, {:bad_request, "Unknown response type"}}
  end
end

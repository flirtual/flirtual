defmodule FlirtualWeb.MatchmakingController do
  use FlirtualWeb, :controller

  import Flirtual.Utilities
  import Flirtual.Matchmaking

  alias Flirtual.User.Profile.LikesAndPasses
  alias Flirtual.{Users, Policy}

  action_fallback FlirtualWeb.FallbackController

  def list_prospects(conn, %{"kind" => kind}) do
    with {:ok, prospect_ids} <-
           compute_prospects(conn.assigns[:session].user, to_atom(kind, :love)) do
      conn |> json(prospect_ids)
    end
  end

  def reset_prospects(conn, _) do
    with {:ok, count} <- reset_prospects(conn.assigns[:session].user) do
      conn |> json(%{count: count})
    end
  end

  def inspect_query(conn, %{"kind" => kind}) do
    conn |> json(generate_query(conn.assigns[:session].user, to_atom(kind, :love)))
  end

  def respond(conn, %{"user_id" => user_id, "type" => type, "kind" => kind, "mode" => mode}) do
    user = conn.assigns[:session].user
    target = Users.get(user_id)

    if is_nil(target) or Policy.cannot?(conn, :read, target) do
      {:error, {:not_found, "User not found", %{user_id: user_id}}}
    else
      with {:ok, result} <-
             respond_profile(
               user: user,
               target: target,
               type: to_atom(type, :like),
               kind: to_atom(kind, :love),
               mode: to_atom(mode, :love)
             ) do
        conn |> json(result)
      end
    end
  end

  def respond(conn, %{"user_id" => user_id, "type" => type, "kind" => kind}) do
    respond(conn, %{"user_id" => user_id, "type" => type, "kind" => kind, "mode" => kind})
  end

  def reverse_respond(_, %{"user_id" => _, "type" => _}) do
    {:error, {:not_implemented}}
  end

  def list_matches(conn, %{"unrequited" => _}) do
    with items <-
           LikesAndPasses.list_unrequited(profile_id: conn.assigns[:session].user_id) do
      conn
      |> json(%{
        count: Enum.group_by(items, & &1.kind) |> Map.new(fn {k, v} -> {k, length(v)} end),
        items:
          items
          |> Policy.filter(conn, :read)
          |> then(&Policy.transform(conn, &1))
      })
    end
  end

  def list_matches(conn, _) do
    with items <-
           LikesAndPasses.list_matches(profile_id: conn.assigns[:session].user_id) do
      conn
      |> json(%{
        count: Enum.group_by(items, & &1.kind) |> Map.new(fn {k, v} -> {k, length(v)} end),
        items:
          items
          |> Policy.filter(conn, :read)
          |> then(&Policy.transform(conn, &1))
      })
    end
  end
end

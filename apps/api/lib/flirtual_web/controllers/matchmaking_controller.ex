defmodule FlirtualWeb.MatchmakingController do
  use FlirtualWeb, :controller

  import FlirtualWeb.Utilities
  import Flirtual.Utilities

  alias Flirtual.Matchmaking
  alias Flirtual.User.Profile.LikesAndPasses
  alias Flirtual.{Policy, Subscription, User, Users}

  action_fallback(FlirtualWeb.FallbackController)

  def queue_information(conn, %{"kind" => kind}) do
    with {:ok, queue_information} <-
           Matchmaking.queue_information(conn.assigns[:session].user, to_atom(kind, :love)) do
      conn
      |> json_with_etag(queue_information)
    end
  end

  def reset_prospects(conn, _) do
    with :ok <- Matchmaking.reset_prospects(conn.assigns[:session].user) do
      conn |> json(%{success: true})
    end
  end

  def reset_likes(conn, _) do
    user = conn.assigns[:session].user

    case LikesAndPasses.delete_unrequited_likes(profile_id: user.id) do
      {:ok, count} -> conn |> json(%{count: count})
      {:error, reason} -> conn |> json(%{error: reason})
    end
  end

  def reset_passes(conn, _) do
    user = conn.assigns[:session].user

    case LikesAndPasses.delete_passes(profile_id: user.id) do
      {:ok, count} -> conn |> json(%{count: count})
      {:error, reason} -> conn |> json(%{error: reason})
    end
  end

  def inspect_query(conn, %{"kind" => kind}) do
    conn
    |> json_with_etag(
      Matchmaking.generate_query(conn.assigns[:session].user, to_atom(kind, :love))
    )
  end

  def response(conn, params) do
    user = conn.assigns[:session].user

    # %{"type" => type, "kind" => kind, "mode" => mode}
    type = Map.get(params, "type", "like")
    kind = Map.get(params, "kind", "love")
    mode = Map.get(params, "mode", kind)

    target_id = Map.get(params, "user_id")
    target = if(is_nil(target_id), do: nil, else: Users.get(target_id))

    with {:ok, value} <-
           Matchmaking.respond(
             user: user,
             target: target,
             type: to_atom(type, :like),
             kind: to_atom(kind, :love),
             mode: to_atom(mode, :love)
           ),
         {:ok, queue} <-
           Matchmaking.queue_information(user, to_atom(mode, :love)) do
      conn |> json(value |> Map.put(:queue, queue))
    else
      {:error, :out_of_likes, reset_at} ->
        {:error,
         {:too_many_requests, :out_of_likes,
          %{
            reset_at: reset_at,
            headers: [
              {"retry-after", DateTime.diff(reset_at, DateTime.utc_now())}
            ]
          }}}

      {:error, :out_of_passes, reset_at} ->
        {:error,
         {:too_many_requests, :out_of_passes,
          %{
            reset_at: reset_at,
            headers: %{
              {"retry-after", DateTime.diff(reset_at, DateTime.utc_now())}
            }
          }}}

      {:error, %Ecto.Changeset{errors: [user_id: {"already_responded", _}]}} ->
        {:error, {:conflict, :already_responded}}

      reason ->
        reason
    end
  end

  def undo_response(conn, %{"mode" => mode}) do
    user = conn.assigns[:session].user
    kind = to_atom(mode, :love)

    with {:ok, _} <- Matchmaking.undo(user, kind),
         {:ok, queue} <- Matchmaking.queue_information(user, kind) do
      conn
      |> json(%{
        queue: queue
      })
    end
  end

  def unmatch(conn, %{"user_id" => user_id}) do
    user = conn.assigns[:session].user
    target = Users.get(user_id)

    if is_nil(target) or Policy.cannot?(conn, :read, target) do
      {:error, {:not_found, :user_not_found, %{user_id: user_id}}}
    else
      with {:ok, _} <- LikesAndPasses.delete_all(profile_id: user.id, target_id: target.id) do
        conn |> json(%{success: true})
      end
    end
  end

  def list_likes(conn, _) do
    with items <-
           LikesAndPasses.list_unrequited(profile_id: conn.assigns[:session].user_id)
           |> Policy.filter(conn, :count) do
      thumbnails =
        items
        |> Enum.take(3)
        |> Enum.reverse()
        |> Enum.map(fn item ->
          if Subscription.active?(conn.assigns[:session].user.subscription) do
            item.profile_id |> User.get() |> User.avatar_url("icon")
          else
            item.profile_id |> User.get() |> User.avatar_url("blur")
          end
        end)

      conn
      |> json_with_etag(%{
        count:
          items
          |> Enum.group_by(& &1.kind)
          |> Map.new(fn {k, v} -> {k, length(v)} end),
        items:
          items
          |> Policy.filter(conn, :read)
          |> then(&Policy.transform(conn, &1)),
        thumbnails: thumbnails
      })
    end
  end

  # def list_matches(conn, _) do
  #   with items <-
  #          LikesAndPasses.list_matches(profile_id: conn.assigns[:session].user_id) do
  #     conn
  #     |> json_with_etag(%{
  #       count: Enum.group_by(items, & &1.kind) |> Map.new(fn {k, v} -> {k, length(v)} end),
  #       items:
  #         items
  #         |> Policy.filter(conn, :read)
  #         |> then(&Policy.transform(conn, &1))
  #     })
  #   end
  # end
end

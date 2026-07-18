defmodule FlirtualWeb.MatchmakingController do
  use FlirtualWeb, :controller

  import FlirtualWeb.Utilities
  import Flirtual.Utilities

  import Ecto.Query

  alias Flirtual.{Entitlement, Policy, Repo, Search, Users}
  alias Flirtual.Matchmaking
  alias Flirtual.User.Profile.Image
  alias Flirtual.User.Profile.LikesAndPasses
  alias Flirtual.User.Profile.Prospect

  action_fallback(FlirtualWeb.FallbackController)

  def queue_information(conn, params) do
    mode = to_atom(params["mode"] || params["kind"], :love)

    with {:ok, queue_information} <-
           Matchmaking.queue_information(conn.assigns[:session].user, mode) do
      conn
      |> json_with_etag(queue_information)
    end
  end

  def dismiss_notice(conn, params) do
    user = conn.assigns[:session].user
    mode = to_atom(params["mode"] || params["kind"], :love)

    :ok = Matchmaking.dismiss_fallback_notice(user.id, mode)

    conn |> json(%{success: true})
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

  def inspect_query(conn, params) do
    user = conn.assigns[:session].user

    if :debugger not in user.tags and :admin not in user.tags do
      {:error, {:forbidden, :missing_permission}}
    else
      kind = to_atom(params["mode"] || params["kind"], :love)
      fallback = params["fallback"] == "true"

      query = Flirtual.Matchmaking.Query.build(user, kind, fallback: fallback)

      results =
        case Search.search(query) do
          {:ok, hits} -> hits
          {:error, reason} -> %{"error" => inspect(reason)}
        end

      conn
      |> json(%{
        query: %{
          kind: query.kind,
          fallback: query.fallback,
          size: query.size,
          exclude_ids: query.exclude_ids,
          filters: Enum.map(query.filters, &inspect/1),
          factors: Enum.map(query.factors, &inspect/1)
        },
        compiled: Search.compile(query),
        results: results
      })
    end
  end

  def response(conn, params) do
    user = conn.assigns[:session].user

    type = to_atom(Map.get(params, "type", "like"), :like)
    mode = to_atom(Map.get(params, "mode", "love"), :love)
    target_id = Map.get(params, "user_id")

    with {:ok, value} <-
           Matchmaking.respond(
             user: user,
             target_id: target_id,
             type: type,
             mode: mode
           ),
         {:ok, queue} <- Matchmaking.queue_information(user, mode) do
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

      {:error, :out_of_browses, reset_at} ->
        {:error,
         {:too_many_requests, :out_of_browses,
          %{
            reset_at: reset_at,
            headers: [
              {"retry-after", DateTime.diff(reset_at, DateTime.utc_now())}
            ]
          }}}

      reason ->
        reason
    end
  end

  def undo_response(conn, params) do
    user = conn.assigns[:session].user
    mode = to_atom(params["mode"] || params["kind"], :love)

    with {:ok, prospect} <- Matchmaking.undo(user, mode),
         {:ok, queue} <- Matchmaking.queue_information(user, mode) do
      conn
      |> json(%{
        queue: queue,
        user_id: prospect.target_id
      })
    end
  end

  def skip_prospect(conn, %{"user_id" => target_id}) do
    user = conn.assigns[:session].user
    target = Users.get(target_id)

    if is_nil(target) or Policy.cannot?(conn, :read, target) do
      Prospect
      |> where(profile_id: ^user.id, target_id: ^target_id)
      |> Repo.delete_all()

      conn |> json(%{success: true})
    else
      {:error, {:conflict, :prospect_visible, %{user_id: target_id}}}
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

  def list_likes(conn, params) do
    user = conn.assigns[:session].user
    cursor = LikesAndPasses.Cursor.decode(params["cursor"])

    filters =
      %{}
      |> then(fn filter ->
        case params["kind"] do
          "love" -> Map.put(filter, :kind, :love)
          "friend" -> Map.put(filter, :kind, :friend)
          _ -> filter
        end
      end)
      |> then(fn filter ->
        case params["gender"] do
          "woman" -> Map.put(filter, :gender, :woman)
          "man" -> Map.put(filter, :gender, :man)
          "other" -> Map.put(filter, :gender, :other)
          _ -> filter
        end
      end)

    {items, metadata} =
      LikesAndPasses.list_unrequited(profile_id: user.id, cursor: cursor, filters: filters)

    items = items |> Policy.filter(conn, :read) |> then(&Policy.transform(conn, &1))

    conn
    |> json_with_etag(%{
      data: items,
      metadata: metadata
    })
  end

  def preview_likes(conn, _) do
    user = conn.assigns[:session].user

    count = LikesAndPasses.count_unrequited(profile_id: user.id)

    variant = if Entitlement.premium?(user.entitlements), do: "icon", else: "blur"

    profile_ids =
      LikesAndPasses.list_unrequited(
        profile_id: user.id,
        cursor: %LikesAndPasses.Cursor{limit: 3}
      )
      |> elem(0)
      |> Enum.reverse()
      |> Enum.map(& &1.profile_id)

    images_by_profile =
      Image
      |> where([i], i.profile_id in ^profile_ids)
      |> order_by([i], [i.profile_id, i.order])
      |> Repo.all()
      |> Enum.group_by(& &1.profile_id)

    thumbnails =
      Enum.map(profile_ids, fn profile_id ->
        images_by_profile
        |> Map.get(profile_id, [])
        |> List.first()
        |> Image.url(variant)
      end)

    conn
    |> json_with_etag(%{
      count: count,
      thumbnails: thumbnails
    })
  end
end

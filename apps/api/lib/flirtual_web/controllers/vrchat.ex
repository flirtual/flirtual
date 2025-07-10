defmodule FlirtualWeb.VRChatController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller

  require Logger

  action_fallback FlirtualWeb.FallbackController

  def get_categorized_worlds(conn, _params) do
    case Flirtual.VRChat.with_session(fn vrchat_conn ->
           # Load all categories in parallel
           spotlight_task =
             Task.async(fn ->
               VRChat.Worlds.search_worlds(vrchat_conn,
                 sort: "publicationDate",
                 tag: "admin_spotlight_xplat",
                 n: 5
               )
             end)

           active_task =
             Task.async(fn ->
               VRChat.Worlds.get_active_worlds(vrchat_conn,
                 notag: "author_tag_game,admin_spotlight_xplat",
                 n: 5
               )
             end)

           games_task =
             Task.async(fn ->
               VRChat.Worlds.get_active_worlds(vrchat_conn,
                 tag: "author_tag_game",
                 notag: "admin_spotlight_xplat",
                 n: 5
               )
             end)

           new_task =
             Task.async(fn ->
               VRChat.Worlds.search_worlds(vrchat_conn,
                 sort: "hotness",
                 tag: "system_published_recently",
                 notag: "admin_spotlight_xplat",
                 n: 5
               )
             end)

           random_task =
             Task.async(fn ->
               VRChat.Worlds.search_worlds(vrchat_conn,
                 sort: "shuffle",
                 notag: "admin_spotlight_xplat",
                 n: 5
               )
             end)

           # Wait for all tasks to complete

           spotlight_result = Task.await(spotlight_task, 10_000)
           active_result = Task.await(active_task, 10_000)
           games_result = Task.await(games_task, 10_000)
           new_result = Task.await(new_task, 10_000)
           random_result = Task.await(random_task, 10_000)

           {:ok,
            %{
              spotlight: spotlight_result,
              active: active_result,
              games: games_result,
              new: new_result,
              random: random_result
            }}
         end) do
      {:ok,
       %{
         spotlight: {:ok, spotlight},
         active: {:ok, active},
         games: {:ok, games},
         new: {:ok, new},
         random: {:ok, random}
       }} ->
        format_worlds = fn worlds ->
          Enum.map(worlds, fn world ->
            %{
              id: world.id,
              name: world.name,
              imageUrl: world.imageUrl,
              thumbnailImageUrl: world.thumbnailImageUrl,
              authorName: world.authorName,
              tags: world.tags || [],
              popularity: world.popularity || 0,
              heat: world.heat || 0
            }
          end)
        end

        json(conn, %{
          categories: %{
            spotlight: %{
              title: "Spotlight",
              worlds: format_worlds.(spotlight),
              hasMore: length(spotlight) == 5
            },
            active: %{
              title: "Active",
              worlds: format_worlds.(active),
              hasMore: length(active) == 5
            },
            games: %{
              title: "Games",
              worlds: format_worlds.(games),
              hasMore: length(games) == 5
            },
            new: %{
              title: "New",
              worlds: format_worlds.(new),
              hasMore: length(new) == 5
            },
            random: %{
              title: "Random",
              worlds: format_worlds.(random),
              hasMore: length(random) == 5
            }
          }
        })

      {:error, reason} ->
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Failed to fetch worlds", reason: inspect(reason)})
    end
  end

  def get_category_worlds(conn, params) do
    category = Map.get(params, "category", "")
    page = Map.get(params, "page", "0") |> String.to_integer()
    per_page = 5
    offset = page * per_page

    case category do
      "spotlight" ->
        case Flirtual.VRChat.with_session(fn vrchat_conn ->
               VRChat.Worlds.search_worlds(vrchat_conn,
                 sort: "publicationDate",
                 tag: "admin_spotlight_xplat",
                 n: per_page,
                 offset: offset
               )
             end) do
          {:ok, worlds} ->
            formatted_worlds = format_world_list(worlds)
            has_more = length(worlds) == per_page
            json(conn, %{worlds: formatted_worlds, hasMore: has_more})

          {:error, reason} ->
            conn
            |> put_status(:internal_server_error)
            |> json(%{error: "Failed to fetch worlds", reason: inspect(reason)})
        end

      "active" ->
        case Flirtual.VRChat.with_session(fn vrchat_conn ->
               VRChat.Worlds.get_active_worlds(vrchat_conn,
                 notag: "author_tag_game,admin_spotlight_xplat",
                 n: per_page,
                 offset: offset
               )
             end) do
          {:ok, worlds} ->
            formatted_worlds = format_world_list(worlds)
            has_more = length(worlds) == per_page
            json(conn, %{worlds: formatted_worlds, hasMore: has_more})

          {:error, reason} ->
            conn
            |> put_status(:internal_server_error)
            |> json(%{error: "Failed to fetch worlds", reason: inspect(reason)})
        end

      "games" ->
        case Flirtual.VRChat.with_session(fn vrchat_conn ->
               VRChat.Worlds.get_active_worlds(vrchat_conn,
                 tag: "author_tag_game",
                 notag: "admin_spotlight_xplat",
                 n: per_page,
                 offset: offset
               )
             end) do
          {:ok, worlds} ->
            formatted_worlds = format_world_list(worlds)
            has_more = length(worlds) == per_page
            json(conn, %{worlds: formatted_worlds, hasMore: has_more})

          {:error, reason} ->
            conn
            |> put_status(:internal_server_error)
            |> json(%{error: "Failed to fetch worlds", reason: inspect(reason)})
        end

      "new" ->
        case Flirtual.VRChat.with_session(fn vrchat_conn ->
               VRChat.Worlds.search_worlds(vrchat_conn,
                 sort: "hotness",
                 tag: "system_published_recently",
                 notag: "admin_spotlight_xplat",
                 n: per_page,
                 offset: offset
               )
             end) do
          {:ok, worlds} ->
            formatted_worlds = format_world_list(worlds)
            has_more = length(worlds) == per_page
            json(conn, %{worlds: formatted_worlds, hasMore: has_more})

          {:error, reason} ->
            conn
            |> put_status(:internal_server_error)
            |> json(%{error: "Failed to fetch worlds", reason: inspect(reason)})
        end

      "random" ->
        case Flirtual.VRChat.with_session(fn vrchat_conn ->
               VRChat.Worlds.search_worlds(vrchat_conn,
                 sort: "shuffle",
                 notag: "admin_spotlight_xplat",
                 n: per_page,
                 offset: offset
               )
             end) do
          {:ok, worlds} ->
            formatted_worlds = format_world_list(worlds)
            has_more = length(worlds) == per_page
            json(conn, %{worlds: formatted_worlds, hasMore: has_more})

          {:error, reason} ->
            conn
            |> put_status(:internal_server_error)
            |> json(%{error: "Failed to fetch worlds", reason: inspect(reason)})
        end

      _ ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Invalid category"})
    end
  end

  defp format_world_list(worlds) do
    Enum.map(worlds, fn world ->
      %{
        id: world.id,
        name: world.name,
        imageUrl: world.imageUrl,
        thumbnailImageUrl: world.thumbnailImageUrl,
        authorName: world.authorName,
        tags: world.tags || [],
        popularity: world.popularity || 0,
        heat: world.heat || 0
      }
    end)
  end

  def get_active_worlds(conn, params) do
    page = Map.get(params, "page", "0") |> String.to_integer()
    per_page = 12
    offset = page * per_page

    case Flirtual.VRChat.with_session(fn vrchat_conn ->
           # GET /worlds endpoint without search param shows active worlds
           VRChat.Worlds.search_worlds(vrchat_conn,
             featured: false,
             sort: "popularity",
             order: "descending",
             n: per_page,
             offset: offset
           )
         end) do
      {:ok, worlds} ->
        formatted_worlds =
          Enum.map(worlds, fn world ->
            %{
              id: world.id,
              name: world.name,
              imageUrl: world.imageUrl,
              thumbnailImageUrl: world.thumbnailImageUrl,
              authorName: world.authorName,
              tags: world.tags || [],
              popularity: world.popularity || 0,
              heat: world.heat || 0
            }
          end)

        # If we got fewer than requested, there are no more pages
        has_more = length(worlds) == per_page
        json(conn, %{worlds: formatted_worlds, hasMore: has_more})
    end
  end

  def search_worlds(conn, params) do
    search_term = Map.get(params, "search", "")
    page = Map.get(params, "page", "0") |> String.to_integer()
    per_page = 12
    offset = page * per_page

    if String.trim(search_term) == "" do
      conn
      |> put_status(:bad_request)
      |> json(%{error: "Search term is required"})
    else
      case Flirtual.VRChat.with_session(fn vrchat_conn ->
             # GET /worlds endpoint with search parameter
             VRChat.Worlds.search_worlds(vrchat_conn,
               search: search_term,
               featured: false,
               sort: "relevance",
               fuzzy: true,
               order: "descending",
               n: per_page,
               offset: offset
             )
           end) do
        {:ok, worlds} ->
          formatted_worlds =
            Enum.map(worlds, fn world ->
              %{
                id: world.id,
                name: world.name,
                imageUrl: world.imageUrl,
                thumbnailImageUrl: world.thumbnailImageUrl,
                authorName: world.authorName,
                tags: world.tags || [],
                popularity: world.popularity || 0,
                heat: world.heat || 0
              }
            end)

          # If we got fewer than requested, there are no more pages
          has_more = length(worlds) == per_page
          json(conn, %{worlds: formatted_worlds, hasMore: has_more})

        {:error, reason} ->
          {:error, :upstream}
      end
    end
  end

  def create_instance(conn, params) do
    world_id = Map.get(params, "world_id")
    conversation_id = Map.get(params, "conversation_id")

    with {:world_id, false} <- {:world_id, is_nil(world_id) or String.trim(world_id) == ""},
         {:conversation_id, false} <-
           {:conversation_id, is_nil(conversation_id) or String.trim(conversation_id) == ""},
         user when not is_nil(user) <- conn.assigns[:session].user do
      case Flirtual.VRChat.with_session(fn vrchat_conn ->
             # Get current user ID for ownerId
             current_user =
               case VRChat.Authentication.get_current_user(vrchat_conn) do
                 {:ok, _vrchat_conn, user} ->
                   user.id

                 {:ok, user} ->
                   user.id

                 _ ->
                   # Try alternative approach - make the request directly through the conn
                   case Tesla.get(vrchat_conn, "/auth/user") do
                     {:ok, %Tesla.Env{status: 200, body: user}} -> user.id
                     _ -> nil
                   end
               end

             if is_nil(current_user) do
               {:error, "Unable to get current user ID"}
             else
               # Build request body with only the required fields
               body = %{
                 worldId: world_id,
                 type: "private",
                 region: "use",
                 canRequestInvite: true,
                 ownerId: current_user
               }

               # Make the request using the VRChat Tesla client directly
               case Tesla.post(vrchat_conn, "/instances", body) do
                 {:ok, %Tesla.Env{status: status, body: response}} when status in [200, 201] ->
                   # The response is a JSON string, we need to decode it
                   case Jason.decode(response) do
                     {:ok, decoded} -> {:ok, decoded}
                     # fallback if already decoded
                     {:error, _} -> {:ok, response}
                   end

                 {:ok, %Tesla.Env{status: status, body: error_body}} ->
                   {:error, %{status: status, body: error_body}}

                 {:error, reason} ->
                   Logger.error("Failed to create instance: #{inspect(reason)}")
                   {:error, :upstream}
               end
             end
           end) do
        {:ok, instance} ->
          short_name = Map.get(instance, "shortName", "")

          # Send the TalkJS message from backend as a regular message from the user
          messages = [
            %{
              text: "https://vrch.at/#{short_name}",
              sender: ShortUUID.decode!(user.id)
            }
          ]

          # Send system message via TalkJS API
          # Note: create_messages only returns {:ok, _} on success, crashes on error
          try do
            case Flirtual.Talkjs.create_messages(conversation_id, messages) do
              {:ok, _} ->
                # Response should include shortName field
                json(conn, %{
                  instanceId: Map.get(instance, "id", Map.get(instance, "instanceId", "")),
                  shortName: short_name,
                  worldId: world_id
                })
            end
          rescue
            error ->
              Logger.error("Failed to send TalkJS message: #{inspect(error)}")

              # Still return success for instance creation, but log the message failure
              json(conn, %{
                instanceId: Map.get(instance, "id", Map.get(instance, "instanceId", "")),
                shortName: short_name,
                worldId: world_id,
                messageError: true
              })
          end

        {:error, reason} ->
          require Logger
          Logger.error("Failed to create VRChat instance: #{inspect(reason)}")

          conn
          |> put_status(:internal_server_error)
          |> json(%{error: "Failed to create instance", details: inspect(reason)})
      end
    else
      {:world_id, true} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "World ID is required"})

      {:conversation_id, true} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Conversation ID is required"})

      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid credentials"})
    end
  end
end

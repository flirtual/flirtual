defmodule FlirtualWeb.VRChatController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller

  import FlirtualWeb.Utilities

  require Logger

  action_fallback FlirtualWeb.FallbackController

  defp transform_worlds(worlds) do
    Enum.map(worlds, &transform_world/1)
  end

  defp transform_world(world) do
    %{
      id: world.id,
      name: world.name,
      description: Flirtual.VRChat.unescape(Map.get(world, :description, "")),
      tags: world.tags,
      authorName: world.authorName,
      authorId: world.authorId,
      imageUrl: world.imageUrl,
      thumbnailImageUrl: world.thumbnailImageUrl
    }
  end

  @world_categories [
    "recommended",
    "spotlight",
    "active",
    "games",
    "new",
    "random"
  ]

  @worlds_per_page 10

  def format_world_params(params) do
    page =
      params
      |> Map.get("page", "0")
      |> String.to_integer()

    [
      n: @worlds_per_page,
      offset: page * @worlds_per_page
    ]
  end

  def get_worlds_by_category(conn, %{"category" => category} = params)
      when category in @world_categories do
    case Flirtual.VRChat.with_session(
           &Flirtual.VRChat.get_worlds_by_category(
             &1,
             category,
             format_world_params(params)
           )
         ) do
      {:ok, worlds} ->
        conn
        |> json_with_etag(transform_worlds(worlds))

      {:error, %{status: 429}} ->
        {:error, {:too_many_requests}}
    end
  end

  def search_worlds(conn, %{"query" => query} = params) do
    params = format_world_params(params)

    {:ok, worlds} =
      Flirtual.VRChat.with_session(
        &VRChat.Worlds.search_worlds(
          &1,
          params
          |> Keyword.merge(
            search: query,
            featured: false,
            sort: "relevance",
            fuzzy: true,
            order: "descending"
          )
        )
      )

    conn
    |> json_with_etag(transform_worlds(worlds))
  end

  def create_instance(conn, params) do
    world_id = Map.get(params, "world_id")
    conversation_id = Map.get(params, "conversation_id")

    with {:world_id, false} <- {:world_id, is_nil(world_id) or String.trim(world_id) == ""},
         {:conversation_id, false} <-
           {:conversation_id, is_nil(conversation_id) or String.trim(conversation_id) == ""},
         user when not is_nil(user) <- conn.assigns[:session].user do
      case Flirtual.VRChat.with_session(fn vrchat ->
             # Get current user ID for ownerId
             current_user =
               case VRChat.Authentication.get_current_user(vrchat) do
                 {:ok, _vrchat, user} ->
                   user.id

                 {:ok, user} ->
                   user.id

                 _ ->
                   # Try alternative approach - make the request directly through the conn
                   case Tesla.get(vrchat, "/auth/user") do
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
               case Tesla.post(vrchat, "/instances", body) do
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

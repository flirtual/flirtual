defmodule FlirtualWeb.VRChatController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller

  import FlirtualWeb.Utilities

  require Logger

  action_fallback FlirtualWeb.FallbackController

  # Not in the router: runtime config loads after it compiles.
  plug(:require_vrchat)

  defp require_vrchat(conn, _) do
    if Flirtual.Features.vrchat?() do
      conn
    else
      conn
      |> FlirtualWeb.FallbackController.call({:error, {:not_found, :feature_disabled}})
      |> halt()
    end
  end

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
         user when not is_nil(user) <- conn.assigns[:session].user,
         :ok <- invite_rate_limit(user) do
      case Flirtual.VRChat.with_session(&Flirtual.VRChat.create_instance(&1, world_id)) do
        {:ok, instance} ->
          short_name = Map.get(instance, "shortName", "")

          response = %{
            instanceId: Map.get(instance, "id", Map.get(instance, "instanceId", "")),
            shortName: short_name,
            worldId: world_id
          }

          case send_invite(user, conversation_id, "https://vrch.at/#{short_name}") do
            {:ok, _} ->
              json(conn, response)

            {:error, reason} ->
              Logger.error("Failed to send VRChat invite message: #{inspect(reason)}")
              json(conn, Map.put(response, :messageError, true))
          end
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

      {:error, :rate_limited} ->
        {:error, {:too_many_requests, :rate_limited}}
    end
  end

  defp invite_rate_limit(user) do
    if Flirtual.Chat.enabled?(), do: Flirtual.Chat.rate_limit(:send, user.id), else: :ok
  end

  defp send_invite(user, conversation_id, text) do
    if Flirtual.Chat.enabled?() do
      Flirtual.Chat.send_message(user, conversation_id, %{"text" => text})
    else
      Flirtual.Talkjs.create_messages(conversation_id, [
        %{text: text, sender: ShortUUID.decode!(user.id)}
      ])
    end
  rescue
    error -> {:error, error}
  end

  def create_random_instance(conn, _params) do
    random_offset = :rand.uniform(1000) - 1

    case Flirtual.VRChat.with_session(fn vrchat ->
           case Flirtual.VRChat.get_worlds_by_category(vrchat, "random",
                  n: 1,
                  offset: random_offset
                ) do
             {:ok, [world | _]} ->
               case Flirtual.VRChat.create_instance(vrchat, world.id) do
                 {:ok, instance} -> {:ok, instance, world}
                 {:error, reason} -> {:error, reason}
               end

             {:ok, []} ->
               {:error, "No worlds found"}

             {:error, reason} ->
               {:error, reason}
           end
         end) do
      {:ok, instance, world} ->
        short_name = Map.get(instance, "shortName", "")

        json(conn, %{
          instanceId: Map.get(instance, "id", Map.get(instance, "instanceId", "")),
          shortName: short_name,
          inviteUrl: "https://vrch.at/#{short_name}",
          worldId: world.id,
          worldName: world.name,
          worldImageUrl: world.thumbnailImageUrl
        })
    end
  end
end

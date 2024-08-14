defmodule FlirtualWeb.ConversationController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import FlirtualWeb.Utilities
  import Phoenix.Controller

  alias Flirtual.{Conversation, Policy, Report, Talkjs}

  action_fallback(FlirtualWeb.FallbackController)

  def get(conn, %{"conversation_id" => conversation_id}) do
    with {:ok, conversation} <- Conversation.get(conversation_id),
         conversation <- Policy.transform(conn, conversation) do
      conn
      |> json_with_etag(conversation)
    else
      {:error, :not_found} ->
        {:error, {:not_found, "Conversation not found"}}

      reason ->
        reason
    end
  end

  def list(conn, %{"cursor" => cursor}) do
    user = conn.assigns[:session].user

    with {:ok, {data, metadata}} <-
           Conversation.list(user.id, cursor),
         data <- Policy.transform(conn, data) do
      conn
      |> json_with_etag(%{
        data: data,
        metadata: metadata
      })
    end
  end

  def list(conn, _), do: list(conn, %{"cursor" => nil})

  def list_messages(conn, %{"user_id" => user_id}) do
    conversation_id = Talkjs.new_conversation_id(conn.assigns[:session].user.id, user_id)
    conn |> json_with_etag(Talkjs.list_messages(conversation_id))
  end

  def mark_read(conn, _) do
    user = conn.assigns[:session].user

    with {:ok, _} <- Talkjs.mark_conversations_read(user.id) do
      conn |> json(%{success: true})
    end
  end

  def observe(conn, %{"conversation_id" => conversation_id}) do
    with user <- conn.assigns[:session].user,
         {:ok, conversation} <- Conversation.get(conversation_id),
         true <- :admin in user.tags,
         true <-
           (case conversation.participants do
              [_, _ | _] ->
                true

              [user_id1, user_id2] ->
                case Report.get(user_id1, user_id2) do
                  {:ok, _} ->
                    true

                  _ ->
                    case Report.get(user_id2, user_id1) do
                      {:ok, _} -> true
                      _ -> false
                    end
                end

              _ ->
                false
            end),
         {:ok, _} <-
           %{"conversation_id" => conversation_id, "user_id" => user.id}
           |> Flirtual.ObanWorkers.Unobserve.new(schedule_in: 300)
           |> Oban.insert(),
         {:ok, _} <- Talkjs.add_participant(conversation_id, user.id, true) do
      conn |> json(%{success: true})
    else
      _ ->
        {:error,
         {:forbidden, "Cannot observe this conversation", %{conversation_id: conversation_id}}}
    end
  end
end

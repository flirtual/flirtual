defmodule FlirtualWeb.ConversationController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import FlirtualWeb.Utilities
  import Phoenix.Controller

  alias Flirtual.{Chat, Conversation, Policy, Report, Talkjs}

  action_fallback(FlirtualWeb.FallbackController)

  def token(conn, _) do
    if Chat.enabled?() do
      json(conn, %{
        token: FlirtualWeb.ChatSocket.token(conn.assigns[:session]),
        expires_in: FlirtualWeb.ChatSocket.token_max_age()
      })
    else
      {:error, {:not_found, :chat_disabled}}
    end
  end

  def get(conn, %{"conversation_id" => conversation_id}) do
    with {:ok, conversation} <-
           Conversation.get(conversation_id, conn.assigns[:session].user_id),
         :ok <- Policy.can(conn, :read, conversation),
         conversation <- Policy.transform(conn, conversation) do
      conn
      |> json_with_etag(conversation)
    else
      {:error, :not_found} ->
        {:error, {:not_found, :conversation_not_found}}

      {:error, {:unauthorized, _}} ->
        {:error, {:not_found, :conversation_not_found}}

      {:error, :upstream} ->
        {:error, {:bad_gateway, :upstream}}

      reason ->
        reason
    end
  end

  def list(conn, %{"cursor" => cursor}) do
    user = conn.assigns[:session].user

    with {:ok, {data, metadata}} <-
           Conversation.list(user.id, cursor),
         data <- Policy.filter(data, conn, :read),
         data <- Policy.transform(conn, data) do
      conn
      |> json_with_etag(%{
        data: data,
        metadata: metadata
      })
    else
      {:error, :upstream} ->
        {:error, {:bad_gateway, :upstream}}

      {:error, :invalid_limit} ->
        {:error, {:bad_request, :invalid_limit}}
    end
  end

  def list(conn, _), do: list(conn, %{"cursor" => nil})

  def list_messages(conn, %{"conversation_id" => conversation_id} = params) do
    before = if is_binary(params["before"]), do: params["before"]

    with {:ok, conversation} <- Conversation.get(conversation_id),
         :ok <- Policy.can(conn, :read, conversation),
         {:ok, messages} <- Conversation.list_messages(conversation_id, before) do
      conn |> json(Policy.transform(conn, messages))
    else
      {:error, :not_found} ->
        {:error, {:not_found, :conversation_not_found}}

      {:error, {:unauthorized, _}} ->
        {:error, {:not_found, :conversation_not_found}}

      {:error, :upstream} ->
        {:error, {:bad_gateway, :upstream}}

      reason ->
        reason
    end
  end

  def send_message(conn, %{"conversation_id" => conversation_id, "text" => text} = params) do
    with user <- conn.assigns[:session].user,
         {:ok, conversation} <- Conversation.get(conversation_id),
         :ok <- Policy.can(conn, :send_message, conversation),
         {:ok, result} <- create_message(user, conversation_id, text, params) do
      conn |> json(result)
    else
      {:error, :not_found} ->
        {:error, {:not_found, :conversation_not_found}}

      {:error, {:unauthorized, _}} ->
        {:error, {:not_found, :conversation_not_found}}

      {:error, :rate_limited} ->
        {:error, {:too_many_requests, :rate_limited}}

      {:error, reason} when is_atom(reason) ->
        {:error, {:bad_request, reason}}

      reason ->
        reason
    end
  end

  def send_message(_conn, _params), do: {:error, {:bad_request, :missing_text}}

  defp create_message(user, conversation_id, text, params) do
    if Chat.enabled?() do
      with :ok <- Chat.rate_limit(:send, user.id),
           {:ok, message} <-
             Chat.send_message(user, conversation_id, %{
               "text" => text,
               "client_id" => params["client_id"]
             }) do
        {:ok, Chat.render(message)}
      end
    else
      Talkjs.create_messages(conversation_id, [
        %{
          "text" => text,
          "sender" => ShortUUID.decode!(user.id),
          "type" => "UserMessage"
        }
      ])
    end
  end

  defp mark_all_read(user_id) do
    if Chat.enabled?(),
      do: Chat.mark_all_read(user_id),
      else: Talkjs.mark_conversations_read(user_id)
  end

  defp mark_one_read(conversation_id, user_id) do
    if Chat.enabled?(),
      do: Chat.mark_read(user_id, conversation_id),
      else: Talkjs.mark_conversation_read(conversation_id, user_id)
  end

  def mark_read(conn, _) do
    user = conn.assigns[:session].user

    with {:ok, _} <- mark_all_read(user.id) do
      conn |> json(%{success: true})
    end
  end

  def mark_conversation_read(conn, %{"conversation_id" => conversation_id}) do
    with user <- conn.assigns[:session].user,
         {:ok, conversation} <- Conversation.get(conversation_id),
         :ok <- Policy.can(conn, :read, conversation),
         {:ok, _} <- mark_one_read(conversation_id, user.id) do
      conn |> json(%{success: true})
    else
      {:error, :not_found} ->
        {:error, {:not_found, :conversation_not_found}}

      {:error, {:unauthorized, _}} ->
        {:error, {:not_found, :conversation_not_found}}

      {:error, :upstream} ->
        {:error, {:bad_gateway, :upstream}}

      reason ->
        reason
    end
  end

  def leave(conn, %{"conversation_id" => conversation_id}) do
    with user <- conn.assigns[:session].user,
         {:ok, conversation} <- Conversation.get(conversation_id),
         true <- user.id in conversation.participants,
         {:ok, _} <-
           if(Chat.enabled?(),
             do: Chat.disband(conversation_id),
             else: Talkjs.delete_participant(conversation_id, user.id)
           ) do
      conn
      |> json(%{success: true})
    else
      false ->
        {:error, {:not_found, :conversation_not_found}}

      {:error, :not_found} ->
        {:error, {:not_found, :conversation_not_found}}

      reason ->
        reason
    end
  end

  def observe(conn, %{"user_id" => user_id, "target_id" => target_id}) do
    user = conn.assigns[:session].user

    cond do
      not Chat.enabled?() ->
        observe_talkjs(conn, user, user_id, target_id)

      :moderator in user.tags ->
        json(conn, %{success: true})

      true ->
        {:error, {:forbidden, :missing_permission, %{user_id: user_id, target_id: target_id}}}
    end
  end

  defp observe_talkjs(conn, user, user_id, target_id) do
    with conversation_id <- Talkjs.new_conversation_id(user_id, target_id),
         true <- :admin in user.tags,
         %Report{reviewed_at: nil} <- Report.get(user_id, target_id),
         {:ok, _} <-
           %{"conversation_id" => conversation_id, "user_id" => user.id}
           |> Flirtual.ObanWorkers.Unobserve.new(schedule_in: 300)
           |> Oban.insert(),
         {:ok, _} <- Talkjs.add_participant(conversation_id, user.id, true) do
      conn |> json(%{success: true})
    else
      _ ->
        {:error, {:forbidden, :missing_permission, %{user_id: user_id, target_id: target_id}}}
    end
  end
end

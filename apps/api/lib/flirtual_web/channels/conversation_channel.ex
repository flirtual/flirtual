defmodule FlirtualWeb.ConversationChannel do
  use Phoenix.Channel

  alias Flirtual.{Chat, Users}
  alias FlirtualWeb.Presence

  intercept(["closed", "message"])

  @impl true
  def join("conversation:" <> conversation_id, params, socket) do
    with %{} = user <- Users.get(socket.assigns.user_id, []),
         {:ok, %{role: role, conversation: conversation, participant: participant}} <-
           Chat.access(user, conversation_id) do
      socket =
        socket
        |> assign(:conversation_id, conversation_id)
        |> assign(:role, role)

      if role == :participant, do: send(self(), :track)
      send(self(), {:joined, conversation.seq})

      {:ok,
       Map.merge(
         snapshot(conversation_id, params["after"], role),
         %{
           seq: conversation.seq,
           read_only: role != :participant,
           last_read_seq: participant && participant.last_read_seq,
           participant_ids: Chat.active_participant_ids(conversation)
         }
       ), socket}
    else
      _ -> {:error, %{reason: "not_found"}}
    end
  end

  defp render_options(role), do: [unmasked: role == :moderator]

  defp snapshot(conversation_id, after_version, role) when is_integer(after_version) do
    case Chat.changes(conversation_id, after_version) do
      {:ok, messages} -> %{changes: Enum.map(messages, &Chat.render(&1, render_options(role)))}
      :reset -> snapshot(conversation_id, nil, role)
    end
  end

  defp snapshot(conversation_id, _, role) do
    {messages, more} = Chat.list_messages(conversation_id)
    %{messages: Enum.map(messages, &Chat.render(&1, render_options(role))), more: more}
  end

  @impl true
  def handle_info(:track, socket) do
    {:ok, _} =
      Presence.track(
        self(),
        Chat.viewing_topic(socket.assigns.conversation_id),
        socket.assigns.user_id,
        %{}
      )

    {:noreply, socket}
  end

  def handle_info({:joined, seq}, socket) do
    with {:ok, messages} <- Chat.changes(socket.assigns.conversation_id, seq) do
      Enum.each(messages, fn message ->
        push(socket, "message", %{
          message: Chat.render(message, render_options(socket.assigns.role))
        })
      end)
    end

    {:noreply, socket}
  end

  @impl true
  def handle_out("message", %{message: message}, socket) do
    push(socket, "message", %{message: Chat.render(message, render_options(socket.assigns.role))})
    {:noreply, socket}
  end

  def handle_out("closed", _payload, socket) do
    push(socket, "closed", %{})
    {:stop, :normal, socket}
  end

  @impl true
  def handle_in(event, params, socket) do
    handle(event, params, socket)
  rescue
    DBConnection.ConnectionError -> {:reply, {:error, %{reason: "busy"}}, socket}
  end

  defp handle("history", %{"before" => before} = params, socket) when is_integer(before) do
    from = if is_integer(params["from"]), do: params["from"]

    {messages, more} =
      Chat.list_messages(socket.assigns.conversation_id,
        before: before,
        from: from,
        limit: if(from, do: 100, else: 30)
      )

    {:reply,
     {:ok,
      %{
        messages: Enum.map(messages, &Chat.render(&1, render_options(socket.assigns.role))),
        more: more
      }}, socket}
  end

  defp handle("changes", %{"after" => after_version}, socket) when is_integer(after_version) do
    {:reply, {:ok, snapshot(socket.assigns.conversation_id, after_version, socket.assigns.role)},
     socket}
  end

  defp handle(_, _, %{assigns: %{role: :moderator}} = socket),
    do: {:reply, {:error, %{reason: "read_only"}}, socket}

  defp handle("read", params, socket) do
    Chat.mark_read(socket.assigns.user_id, socket.assigns.conversation_id, params["seq"])
    {:reply, :ok, socket}
  end

  defp handle("send", params, socket) do
    write(socket, :send, &Chat.send_message(&1, socket.assigns.conversation_id, params))
  end

  defp handle("edit", %{"id" => message_id, "text" => text}, socket) do
    write(
      socket,
      :action,
      &Chat.edit_message(&1, socket.assigns.conversation_id, message_id, text)
    )
  end

  defp handle("delete", %{"id" => message_id}, socket) do
    write(socket, :action, &Chat.delete_message(&1, socket.assigns.conversation_id, message_id))
  end

  defp handle("react", %{"id" => message_id, "emoji" => emoji} = params, socket) do
    write(
      socket,
      :action,
      &Chat.react(&1, socket.assigns.conversation_id, message_id, emoji, params["add"] != false)
    )
  end

  defp handle(_, _, socket), do: {:reply, {:error, %{reason: "bad_request"}}, socket}

  defp write(socket, limit, change) do
    with :ok <- Chat.rate_limit(limit, socket.assigns.user_id),
         {:ok, message} <- change.(Users.get(socket.assigns.user_id, [])) do
      {:reply, {:ok, %{message: Chat.render(message)}}, socket}
    else
      error -> {:reply, {:error, %{reason: reason(error)}}, socket}
    end
  end

  defp reason({:error, reason}) when is_atom(reason), do: Atom.to_string(reason)
  defp reason(_), do: "internal_server_error"
end

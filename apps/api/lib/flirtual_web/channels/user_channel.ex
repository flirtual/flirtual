defmodule FlirtualWeb.UserChannel do
  use Phoenix.Channel

  alias Flirtual.Chat

  @impl true
  def join("user:" <> user_id, _params, %{assigns: %{user_id: user_id}} = socket) do
    {:ok, unread(user_id), socket}
  end

  def join(_, _, _), do: {:error, %{reason: "not_found"}}

  @impl true
  def handle_in("unread", _params, socket) do
    {:reply, {:ok, unread(socket.assigns.user_id)}, socket}
  end

  defp unread(user_id) do
    ids = Chat.unread_conversation_ids(user_id)

    %{
      unread: Enum.take(ids, Chat.unread_limit()),
      complete: length(ids) <= Chat.unread_limit()
    }
  end
end

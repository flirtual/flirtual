defmodule FlirtualWeb.ConversationController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller
  alias Flirtual.Talkjs

  action_fallback FlirtualWeb.FallbackController

  def list(conn, _) do
    conn |> json(Talkjs.list_conversations(conn.assigns[:session].user.id))
  end

  def list_unread(conn, _) do
    conn |> json(Talkjs.list_conversations(conn.assigns[:session].user.id, unreadsOnly: true))
  end

  def list_messages(conn, %{"user_id" => user_id}) do
    conversation_id = Talkjs.new_conversation_id(conn.assigns[:session].user.id, user_id)
    conn |> json(Talkjs.list_messages(conversation_id))
  end
end

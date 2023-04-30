defmodule FlirtualWeb.ConversationController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller

  alias Flirtual.Policy
  alias Flirtual.Conversation
  alias Flirtual.Talkjs

  action_fallback FlirtualWeb.FallbackController

  def list(conn, %{"cursor" => cursor}) do
    user = conn.assigns[:session].user

    with {:ok, {data, metadata}} <-
           Conversation.list(user.id, cursor),
         data <- Policy.transform(conn, data) do
      conn
      |> json(%{
        data: data,
        metadata: metadata
      })
    end
  end

  def list(conn, _), do: list(conn, %{"cursor" => nil})

  def list_messages(conn, %{"user_id" => user_id}) do
    conversation_id = Talkjs.new_conversation_id(conn.assigns[:session].user.id, user_id)
    conn |> json(Talkjs.list_messages(conversation_id))
  end
end

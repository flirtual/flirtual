defmodule FlirtualWeb.ConversationController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller
  alias Flirtual.Talkjs

  action_fallback FlirtualWeb.FallbackController

  def list(conn, _) do
    conn |> json(Talkjs.list_conversations())
  end

  def list_messages(conn, %{"user_id" => user_id}) do
    conn |> json(Talkjs.list_messages(user_id))
  end
end

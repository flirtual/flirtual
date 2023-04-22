defmodule FlirtualWeb.VRChatController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller

  action_fallback FlirtualWeb.FallbackController

  def search(conn, %{"display_name" => display_name}) do
    with {:ok, vrchat_conn, _} <-
           VRChat.Authentication.login(
             username: "",
             password: "",
             totp_secret: ""
           ),
         {:ok, users} <-
           VRChat.Users.search_users(vrchat_conn, search: Flirtual.VRChat.escape(display_name)) do
      conn
      |> json(
        users
        |> Enum.map(
          &%{
            id: &1.id,
            bio: &1.bio,
            display_name: &1.displayName,
            avatar_url: &1.userIcon || &1.currentAvatarThumbnailImageUrl
          }
        )
      )
    end
  end
end

defmodule FlirtualWeb.UnsubscribeController do
  use FlirtualWeb, :controller

  alias Flirtual.Users

  def get(conn, _) do
    conn
    |> put_status(:found)
    |> redirect(external: "https://flirtu.al/settings/notifications")
  end

  def post(conn, %{"token" => token}) do
    with user <- Users.get_by_unsubscribe_token(token),
         {:ok, _} <-
           Users.update_notification_preferences(user.preferences.email_notifications, %{
             matches: false,
             messages: false,
             likes: false,
             reminders: false,
             newsletter: false
           }) do
      conn
      |> put_status(:ok)
      |> json(%{success: true})
      |> halt()
    else
      _ ->
        conn
        |> put_status(:ok)
        |> json(%{success: false})
        |> halt()
    end
  end
end

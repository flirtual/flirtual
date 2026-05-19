defmodule FlirtualWeb.LiveDashboardAuth do
  import Phoenix.LiveView

  alias Flirtual.User
  alias Flirtual.User.Session

  def on_mount(:require_debugger, _params, _session, socket) do
    if connected?(socket) do
      verify_debugger(socket)
    else
      {:cont, socket}
    end
  end

  defp verify_debugger(socket) do
    with %{"token" => token} when is_binary(token) <- get_connect_info(socket, :session),
         %Session{user: %User{tags: tags}} when is_list(tags) <- Session.get(token: token),
         true <- :debugger in tags do
      {:cont, socket}
    else
      _ -> {:halt, redirect(socket, to: "/")}
    end
  end
end

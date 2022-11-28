defmodule FlirtualWeb.UsersController do
  use FlirtualWeb, :controller

  alias FlirtualWeb.SessionController
  alias Flirtual.{Users, Policy}

  action_fallback FlirtualWeb.FallbackController

  def create(conn, params) do
    with {:ok, user} <- Users.register_user(params) do
      {_, conn} = conn |> SessionController.log_in_user(user)
      conn |> put_status(:created) |> json(user)
    end
  end

  def get(conn, %{"user_id" => id}) do
    user = Users.get(id)

    if is_nil(user) or Policy.cannot?(conn, :read, user) do
      {:error, {:not_found, "User not found", %{user_id: id}}}
    else
      conn |> json(Policy.transform(conn, user))
    end
  end

  def update(conn, %{"user_id" => id} = params) do
    user = Users.get(id)

    with {:ok, user} <- Users.update(user, params) do
      conn |> json(user)
    end
  end

  def update_privacy_preferences(conn, %{"user_id" => user_id} = params) do
    preferences = Users.get_preferences_by_user_id(user_id)

    with {:ok, privacy} <- Users.update_privacy_preferences(preferences.privacy, params) do
      conn |> json(privacy)
    end
  end

  def get_current_user(conn, _) do
    conn |> get(%{"user_id" => conn.assigns[:session].user_id})
  end
end

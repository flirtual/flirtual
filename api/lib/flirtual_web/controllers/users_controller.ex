defmodule FlirtualWeb.UsersController do
  use FlirtualWeb, :controller

  alias Flirtual.Users

  action_fallback FlirtualWeb.FallbackController

  def create(conn, params) do
    with {:ok, user} <- Users.register_user(params) do
      conn |> put_status(:created) |> json(user)
    end
  end

  def get(conn, %{"user_id" => id}) do
    user = Users.get(id)

    if is_nil(user) do
      {:error, {:not_found, "User not found", %{user_id: id}}}
    else
      conn |> json(user)
    end
  end

  def get_current_user(conn, _) do
    conn |> get(%{"user_id" => conn.assigns[:session].user_id})
  end
end

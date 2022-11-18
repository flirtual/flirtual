defmodule FlirtualWeb.UsersController do
  use FlirtualWeb, :controller

  alias FlirtualWeb.SessionController
  alias Flirtual.{User,Users,Policies}

  action_fallback FlirtualWeb.FallbackController

  def create(conn, params) do
    with {:ok, user} <- Users.register_user(params) do
      {_, conn} = conn |> SessionController.log_in_user(user)
      conn |> put_status(:created) |> json(user)
    end
  end
  def get(conn, %{"user_id" => id}) do
    user = Users.get(id)

    case is_nil(user) do
      true -> {:error, {:not_found, "User not found", %{user_id: id}}}
      false ->
        with :ok <- Policies.can(User, :read, conn.assigns.session, user) do
          conn |> json(Policies.transform(User, conn, user))
        end

    end
  end

  def update(conn, %{"user_id" => id}) do
    conn
  end

  def get_current_user(conn, _) do
    conn |> get(%{"user_id" => conn.assigns[:session].user_id})
  end
end

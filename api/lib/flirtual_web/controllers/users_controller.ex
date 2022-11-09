defmodule FlirtualWeb.UsersController do
  use FlirtualWeb, :controller

  alias Flirtual.Users

  action_fallback FlirtualWeb.FallbackController

  def create(conn, params) do
    with {:ok, user} <- Users.register_user(params) do
      conn |> put_status(:created) |> json(user)
    end
  end
end

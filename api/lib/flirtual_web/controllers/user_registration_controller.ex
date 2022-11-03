defmodule FlirtualWeb.UserRegistrationController do
  use FlirtualWeb, :controller

  alias Flirtual.Accounts
  alias Flirtual.User
  alias FlirtualWeb.UserAuth

  import FlirtualWeb.ErrorHelpers

  action_fallback FlirtualWeb.FallbackController

  def new(conn, _params) do
    changeset = Accounts.change_user_registration(%User{})
    render(conn, "new.html", changeset: changeset)
  end

  def create(conn, %{"user" => user_params}) do
    with {:ok, user} <- Accounts.register_user(user_params) do
      conn |> put_status(:created) |> json(user)
    end
  end
end

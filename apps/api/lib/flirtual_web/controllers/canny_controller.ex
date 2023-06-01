defmodule FlirtualWeb.CannyController do
  use FlirtualWeb, :controller

  alias Flirtual.Canny

  def create_token(conn, _params) do
    user = conn.assigns[:session].user
    {:ok, token} = Canny.create_token(user)
    json(conn, %{token: token})
  end
end

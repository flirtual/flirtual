defmodule FlirtualWeb.HealthController do
  use FlirtualWeb, :controller

  def health(conn, _) do
    conn
    |> put_status(:ok)
    |> json(%{status: "ok"})
    |> halt()
  end
end

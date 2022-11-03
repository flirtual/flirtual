defmodule FlirtualWeb.FallbackController do
  use Phoenix.Controller

  import FlirtualWeb.ErrorHelpers

  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{errors: changeset |> transform_changeset_errors})
    |> halt()
    end
end

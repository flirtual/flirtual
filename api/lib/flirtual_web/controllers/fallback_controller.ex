defmodule FlirtualWeb.FallbackController do
  use Phoenix.Controller

  import FlirtualWeb.ErrorHelpers

  def call(%Plug.Conn{} = conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(
      new_error("Unprocessable entity", %{
        fields: transform_changeset_errors(changeset)
      })
    )
    |> halt()
  end

  def call(%Plug.Conn{} = conn, params) do
    IO.warn("Internal server error")
    IO.inspect(params)

    conn
    |> put_status(:internal_server_error)
    |> json(new_error("Internal server error"))
    |> halt()
  end
end

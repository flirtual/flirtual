defmodule FlirtualWeb.FallbackController do
  use Phoenix.Controller

  import FlirtualWeb.ErrorHelpers

  def call(%Plug.Conn{} = conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_error(
      :bad_request,
      "Bad Request",
      %{
        properties: transform_changeset_errors(changeset)
      }
    )
    |> halt()
  end

  def call(%Plug.Conn{} = conn, {:error, {status, message}}) do
    conn |> put_error(status, message) |> halt()
  end

  def call(%Plug.Conn{} = conn, {:error, {status, message, details}}) do
    conn |> put_error(status, message, details) |> halt()
  end

  def call(conn, :not_found) do
    conn |> put_error(:not_found, "Not found") |> halt()
  end

  def call(%Plug.Conn{} = conn, params) do
    IO.warn("Internal server error")
    IO.inspect(params)

    conn
    |> put_error(:internal_server_error, "Internal server error")
    |> halt()
  end
end

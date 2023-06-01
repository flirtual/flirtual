defmodule FlirtualWeb.FallbackController do
  use Phoenix.Controller
  use Flirtual.Logger, :fallback

  import FlirtualWeb.ErrorHelpers

  def call(%Plug.Conn{} = conn, {:error, %Ecto.Changeset{} = changeset}) do
    properties = transform_changeset_errors(changeset)

    message =
      properties
      |> Map.to_list()
      |> List.first()
      |> then(fn {key, value} -> "#{String.capitalize(key |> to_string())} #{value}" end)

    conn
    |> put_error(
      :bad_request,
      message,
      %{
        properties: properties
      }
    )
    |> halt()
  end

  def call(%Plug.Conn{} = conn, {:error, {status}}) do
    conn |> put_error(status) |> halt()
  end

  def call(%Plug.Conn{} = conn, {:error, {status, message}}) do
    conn |> put_error(status, message) |> halt()
  end

  def call(%Plug.Conn{} = conn, {:error, {status, message, details}}) do
    conn |> put_error(status, message, details) |> halt()
  end

  def call(%Plug.Conn{} = conn, params) do
    log(:critical, ["unhandled request error"], params)

    conn
    |> put_error(:internal_server_error)
    |> halt()
  end
end

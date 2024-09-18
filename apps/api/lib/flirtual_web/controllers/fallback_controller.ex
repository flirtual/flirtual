defmodule FlirtualWeb.FallbackController do
  use Phoenix.Controller
  use Flirtual.Logger, :fallback

  import FlirtualWeb.ErrorHelpers

  def call(%Plug.Conn{} = conn, {:error, %Ecto.Changeset{} = changeset}) do
    properties = transform_changeset_errors(changeset)

    conn
    |> put_error(
      :bad_request,
      :invalid_properties,
      properties
    )
    |> halt()
  end

  @error_status_codes 400..599

  def call(%Plug.Conn{} = conn, {:error, {status}})
      when is_atom(status) or status in @error_status_codes do
    conn |> put_error(status) |> halt()
  end

  def call(%Plug.Conn{} = conn, {:error, {status, message}})
      when is_atom(status) or status in @error_status_codes do
    conn |> put_error(status, message) |> halt()
  end

  def call(%Plug.Conn{} = conn, {:error, {status, message, details}})
      when is_atom(status) or status in @error_status_codes do
    conn |> put_error(status, message, details) |> halt()
  end

  def call(%Plug.Conn{} = conn, params) do
    log(:critical, ["unhandled request error"], params)

    conn
    |> put_error(:internal_server_error)
    |> halt()
  end
end

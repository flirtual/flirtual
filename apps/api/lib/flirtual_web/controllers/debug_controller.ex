defmodule FlirtualWeb.DebugController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller
  alias Flirtual.Crypto
  alias Flirtual.Policy

  action_fallback FlirtualWeb.FallbackController

  def error(conn, %{"cipher" => cipher}) do
    with :ok <- Policy.can(conn, :read_error_cipher, conn.assigns[:session].user),
         {:ok, reason} <- Crypto.decrypt(:error, cipher),
         {:ok, reason} <-
           reason
           |> Map.from_struct()
           |> Poison.encode() do
      conn |> json(Poison.decode!(reason))
    else
      {:error, :invalid} -> {:error, {400, "Unknown cipher"}}
      {:error, %Poison.EncodeError{}} -> {:error, {400, "Could not serialize error"}}
      reason -> reason
    end
  end
end

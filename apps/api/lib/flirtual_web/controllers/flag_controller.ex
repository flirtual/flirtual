defmodule FlirtualWeb.FlagController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller

  alias Flirtual.{Flag, Policy}

  action_fallback(FlirtualWeb.FallbackController)

  def search(conn, params) do
    with :ok <- Policy.can(conn, :search, %Flag{}, policy: Flag.Policy),
         {:ok, page} <- Flag.search(params) do
      conn |> json(page)
    end
  end

  def create(conn, params) do
    with :ok <- Policy.can(conn, :create, %Flag{}, policy: Flag.Policy),
         {:ok, flag} <- Flag.create(params) do
      conn |> json(Policy.transform(conn, flag))
    end
  end

  def delete(conn, %{"flag_id" => flag_id}) do
    with :ok <- Policy.can(conn, :delete, %Flag{}, policy: Flag.Policy),
         {:ok, _} <- Flag.delete(flag_id) do
      conn |> json(%{deleted: true})
    else
      {:error, :not_found} -> {:error, {:not_found, :flag_not_found}}
      value -> value
    end
  end
end

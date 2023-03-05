defmodule FlirtualWeb.ReportController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller

  alias Flirtual.{Report, Policy}

  action_fallback FlirtualWeb.FallbackController

  def list(conn, params) do
    with {:ok, reports} <- Report.list(params) do
      conn |> json(reports |> Enum.filter(&Policy.can(conn, :read, &1)))
    end
  end

  def create(conn, params) do
    params = Map.put(params, "user_id", conn.assigns[:session].user.id)

    with {:ok, report} <- Report.create(params) do
      conn |> json(Policy.transform(conn, report))
    end
  end
end

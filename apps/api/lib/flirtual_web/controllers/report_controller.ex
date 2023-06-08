defmodule FlirtualWeb.ReportController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller

  alias Flirtual.{Report, Policy}

  action_fallback FlirtualWeb.FallbackController

  def list(conn, params) do
    with {:ok, reports} <- Report.list(params) do
      conn |> json(reports |> Enum.filter(&Policy.can?(conn, :read, &1)))
    end
  end

  def create(conn, params) do
    params = Map.put(params, "user_id", conn.assigns[:session].user.id)

    with {:ok, report} <- Report.create(params) do
      conn |> json(Policy.transform(conn, report))
    end
  end

  def delete(conn, %{"report_id" => report_id}) do
    with %Report{} = report <- Report.get(report_id),
         :ok <- Policy.can(conn, :delete, report),
         {:ok, report} <- Report.clear(report, conn.assigns[:session].user) do
      conn |> json(Policy.transform(conn, report))
    else
      nil -> {:error, {:not_found, "Report not found"}}
      value -> value
    end
  end

  def delete(conn, %{"target_id" => target_id}) do
    with reports <-
           Report.list(target_id: target_id)
           |> Enum.filter(&Policy.can?(conn, :delete, &1)),
         {:ok, count} <- Report.clear_all(reports, conn.assigns[:session].user) do
      conn |> json(%{count: count})
    end
  end
end

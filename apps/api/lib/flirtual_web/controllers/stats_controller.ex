defmodule FlirtualWeb.StatsController do
  use FlirtualWeb, :controller

  import Plug.Conn
  import Phoenix.Controller

  alias Flirtual.{Policy, Stats}

  action_fallback(FlirtualWeb.FallbackController)

  def index(conn, _) do
    with :ok <- Policy.can(conn, :read, nil, policy: Stats.Policy),
         {:ok, index} <- Stats.index() do
      conn |> json(index)
    end
  end

  def get(conn, %{"stat_name" => stat_name}) do
    with :ok <- Policy.can(conn, :read, nil, policy: Stats.Policy),
         {:ok, %{columns: columns, rows: rows}} <- Stats.series(stat_name) do
      conn |> json(%{name: stat_name, columns: columns, rows: rows})
    end
  end

  def download(conn, %{"stat_name" => stat_name}) do
    with :ok <- Policy.can(conn, :read, nil, policy: Stats.Policy),
         {:ok, body} <- Stats.csv(stat_name) do
      conn
      |> put_resp_content_type("text/csv")
      |> put_resp_header("content-disposition", ~s(attachment; filename="#{stat_name}.csv"))
      |> send_resp(200, body)
    end
  end
end

defmodule FlirtualWeb.HealthController do
  use FlirtualWeb, :controller

  import Ecto.Query

  alias Flirtual.{Elasticsearch, Repo}
  alias Flirtual.User

  def check("api"), do: :ok

  def check("database") do
    case Repo.one(from u in User, limit: 1, select: 1) do
      1 -> :ok
      _ -> :error
    end
  end

  def check("matchmaking") do
    case Snap.Search.search(Elasticsearch, "users", %{size: 1}) do
      {:ok, %Snap.SearchResponse{hits: %Snap.Hits{hits: [_ | _]}}} -> :ok
      _ -> :error
    end
  end

  def check("notifications") do
    cutoff = DateTime.utc_now() |> DateTime.add(-60, :second)

    with {:ok, _} <- check_worker("Flirtual.ObanWorkers.Email", cutoff),
         {:ok, _} <- check_worker("Flirtual.ObanWorkers.Push", cutoff) do
      :ok
    else
      _ -> :error
    end
  end

  def health(conn, %{"check" => type}) do
    result =
      try do
        check(type)
      rescue
        DBConnection.ConnectionError -> :error
      end

    case result do
      :ok ->
        conn
        |> put_status(:ok)
        |> json(%{status: "ok"})
        |> halt()

      :error ->
        conn
        |> put_status(:service_unavailable)
        |> json(%{status: "error"})
        |> halt()
    end
  end

  def health(conn, _) do
    health(conn, %{"check" => "api"})
  end

  defp check_worker(worker, cutoff) do
    case Oban.Job
         |> where([j], j.worker == ^worker and j.scheduled_at < ^cutoff)
         |> order_by([j], desc: j.scheduled_at)
         |> limit(1)
         |> select([j], j.state)
         |> Repo.one() do
      "completed" -> {:ok, "completed"}
      "cancelled" -> {:ok, "cancelled"}
      {:error, reason} -> {:error, reason}
      reason -> {:error, reason}
    end
  end
end

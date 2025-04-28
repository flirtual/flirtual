defmodule FlirtualWeb.HealthController do
  use FlirtualWeb, :controller

  import Ecto.Query

  alias Flirtual.{Elasticsearch, Repo, Users}

  def health(conn, %{"check" => check}) do
    result =
      case check do
        "api" ->
          :ok

        "database" ->
          case Users.count() do
            n when is_integer(n) and n >= 1 -> :ok
            _ -> :error
          end

        "matchmaking" ->
          case Elasticsearch.search(:users, %{size: 1}) do
            {:ok, %{"hits" => %{"hits" => [_]}}} -> :ok
            _ -> :error
          end

        "notifications" ->
          cutoff = DateTime.utc_now() |> DateTime.add(-60, :second)

          with {:ok, _} <- check_worker("Flirtual.ObanWorkers.Email", cutoff),
               {:ok, _} <- check_worker("Flirtual.ObanWorkers.Push", cutoff) do
            :ok
          else
            _ -> :error
          end

        _ ->
          :error
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

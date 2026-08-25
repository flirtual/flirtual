defmodule Flirtual.ObanWorkers.RefreshConnection do
  use Oban.Worker, queue: :connections, max_attempts: 5
  use Flirtual.Logger, :connection

  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.Connection
  alias Flirtual.Discord
  alias Flirtual.Repo

  @batch_size 100
  @request_interval 100

  def batch_size, do: @batch_size

  def enqueue(connection_ids) when is_list(connection_ids) do
    %{"connection_ids" => connection_ids}
    |> new()
    |> Oban.insert()
  end

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"connection_ids" => connection_ids}}) do
    Connection
    |> where([connection], connection.id in ^connection_ids and connection.type == :discord)
    |> Repo.all()
    |> Enum.reduce_while(:ok, fn connection, _ ->
      case refresh(connection) do
        # Whatever's left of the batch is refreshed when the job runs again.
        {:rate_limited, retry_after} ->
          {:halt, {:snooze, retry_after}}

        # Retrying can't fix a missing or rejected bot token.
        {:fatal, reason} ->
          log(:critical, [:refresh], reason)
          {:halt, {:cancel, reason}}

        :ok ->
          Process.sleep(@request_interval)
          {:cont, :ok}
      end
    end)
  end

  defp refresh(%Connection{} = connection) do
    case Discord.get_user(connection.uid) do
      {:ok, profile} ->
        store_profile(connection, profile)

      {:error, {:rate_limited, retry_after}} ->
        {:rate_limited, retry_after}

      {:error, reason} when reason in [:missing_bot_token, :unauthorized] ->
        {:fatal, reason}

      # Account no longer exists, or a Discord error. Leave the stored username
      # as-is.
      {:error, _reason} ->
        :ok
    end
  end

  # Ecto writes and bumps `updated_at` only if there are changes.
  defp store_profile(%Connection{} = connection, profile) do
    connection
    |> change(%{display_name: profile.display_name, avatar: profile.avatar})
    |> Repo.update()
    |> case do
      {:ok, _} ->
        :ok

      {:error, changeset} ->
        log(:error, [:refresh], connection_id: connection.id, changeset: changeset)
        :ok
    end
  end
end

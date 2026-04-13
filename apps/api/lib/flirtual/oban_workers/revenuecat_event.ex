defmodule Flirtual.ObanWorkers.RevenueCatEvent do
  use Oban.Worker, max_attempts: 6

  alias Flirtual.Discord
  alias Flirtual.RevenueCat

  @backoff_schedule [30, 90, 300, 600, 1800]

  @impl Oban.Worker
  def perform(%Oban.Job{args: payload, attempt: attempt, max_attempts: max_attempts}) do
    case RevenueCat.handle_event(payload) do
      :ok ->
        :ok

      {:unhandled, _reason} ->
        :ok

      {:retry, reason} ->
        if attempt >= max_attempts, do: alert_unresolved(payload, reason)
        {:error, reason}

      {:error, reason} ->
        {:error, reason}

      other ->
        {:error, other}
    end
  end

  defp alert_unresolved(%{"event" => event}, reason) do
    Discord.deliver_webhook(:revenuecat_unresolved,
      app_user_id: event["app_user_id"] || "unknown",
      event_type: event["type"] || "unknown",
      event_id: event["id"] || "unknown",
      reason: reason
    )
  end

  defp alert_unresolved(_, _), do: :ok

  @impl Oban.Worker
  def backoff(%Oban.Job{attempt: attempt}) do
    Enum.at(@backoff_schedule, attempt - 1, List.last(@backoff_schedule))
  end
end

defmodule Flirtual.ObanWorkers.RevenueCatEvent do
  use Oban.Worker, max_attempts: 6

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
        exhausted(payload, reason, attempt >= max_attempts)

      {:error, reason} ->
        {:error, reason}

      other ->
        {:error, other}
    end
  end

  defp exhausted(_payload, reason, false), do: {:error, reason}

  defp exhausted(%{"event" => %{"app_user_id" => app_user_id}} = payload, reason, true) do
    cond do
      not RevenueCat.anonymous_id?(app_user_id) ->
        {:error, reason}

      RevenueCat.unclaimed?(app_user_id) ->
        report_unclaimed(payload)

      # The purchase was moved to the real customer, which we handled on its own
      # webhook, or it expired.
      true ->
        :ok
    end
  end

  defp exhausted(_payload, reason, true), do: {:error, reason}

  defp report_unclaimed(%{"event" => event}) do
    Sentry.capture_message("Unclaimed RevenueCat purchase",
      level: :warning,
      tags: %{
        revenuecat_store: to_string(event["store"] || "unknown"),
        revenuecat_event_type: to_string(event["type"] || "unknown")
      },
      extra: %{
        revenuecat_customer: event["app_user_id"],
        store_order: event["original_transaction_id"] || event["transaction_id"],
        event_id: event["id"],
        expires_at: event["expiration_at_ms"]
      }
    )

    :ok
  end

  @impl Oban.Worker
  def backoff(%Oban.Job{attempt: attempt}) do
    Enum.at(@backoff_schedule, attempt - 1, List.last(@backoff_schedule))
  end
end

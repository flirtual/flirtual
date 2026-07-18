defmodule Flirtual.ObanWorkers.Reconcile do
  use Oban.Worker,
    queue: :default,
    max_attempts: 8,
    unique: [keys: [:user_id], states: [:available, :scheduled, :retryable]]

  alias Flirtual.Reconciliation
  alias Flirtual.Users

  @backoff_schedule [30, 90, 300, 900, 1800, 3600, 7200]

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id}}) do
    case Users.get(user_id) do
      nil ->
        :ok

      user ->
        case Reconciliation.reconcile(user) do
          :ok -> :ok
          {:retry, reason} -> {:error, reason}
        end
    end
  end

  @impl Oban.Worker
  def backoff(%Oban.Job{attempt: attempt}) do
    Enum.at(@backoff_schedule, attempt - 1, List.last(@backoff_schedule))
  end

  def enqueue(user_id) do
    %{"user_id" => user_id} |> new() |> Oban.insert()
  end

  # When we learn a paid-through date, we schedule a reconcile for that moment:
  # if the subscription renewed the term extends, if a payment is pending it
  # gets a grace extension, otherwise it lapses.
  def schedule_lapse(_user_id, nil), do: {:ok, :perpetual}

  def schedule_lapse(user_id, %DateTime{} = entitled_until) do
    if DateTime.after?(entitled_until, DateTime.utc_now()) do
      %{"user_id" => user_id}
      |> new(
        scheduled_at: DateTime.add(entitled_until, 60, :second),
        replace: [scheduled: [:scheduled_at]]
      )
      |> Oban.insert()
    else
      {:ok, :lapsed}
    end
  end
end

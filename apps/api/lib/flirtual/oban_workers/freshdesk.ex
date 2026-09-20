defmodule Flirtual.ObanWorkers.Freshdesk do
  use Oban.Worker, queue: :notifications, max_attempts: 5

  alias Flirtual.Freshdesk

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"ticket" => ticket}}) do
    case Freshdesk.create_ticket(ticket) do
      {:ok, _} -> :ok
      :ok -> :ok
      {:error, reason} -> {:error, reason}
    end
  end
end

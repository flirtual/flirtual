defmodule Flirtual.ObanWorkers.Unobserve do
  use Oban.Worker, unique: [period: :infinity, states: [:available, :scheduled]]

  alias Flirtual.Talkjs

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"conversation_id" => conversation_id, "user_id" => user_id}}) do
    unobserve(conversation_id, user_id)
  end

  def unobserve(conversation_id, user_id) do
    Talkjs.delete_participant(conversation_id, user_id)
  end
end

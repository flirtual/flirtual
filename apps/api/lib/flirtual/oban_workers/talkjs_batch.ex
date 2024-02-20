defmodule Flirtual.ObanWorkers.TalkjsBatch do
  use Oban.Worker, priority: 3, unique: [period: :infinity, states: [:available, :scheduled]]

  alias Flirtual.Talkjs

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"operations" => operations}}) do
    Talkjs.batch(operations)
  end
end

defmodule Flirtual.ObanWorkers.TalkjsBatch do
  use Oban.Worker, priority: 1, unique: [period: :infinity, states: :incomplete]

  alias Flirtual.Talkjs

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"operations" => operations}}) do
    Talkjs.batch(operations)
  end
end

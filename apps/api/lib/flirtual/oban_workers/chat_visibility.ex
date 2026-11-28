defmodule Flirtual.ObanWorkers.ChatVisibility do
  use Oban.Worker, queue: :notifications, max_attempts: 3

  alias Flirtual.Chat

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id}}) do
    Chat.announce_visibility(user_id)
  end
end

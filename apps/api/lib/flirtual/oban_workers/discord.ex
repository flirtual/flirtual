defmodule Flirtual.ObanWorkers.Discord do
  use Oban.Worker, queue: :notifications, max_attempts: 5

  alias Flirtual.Discord
  alias Flirtual.Hash

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"name" => name, "body" => body} = args}) do
    case Discord.send_webhook(
           name,
           body,
           wait: Map.get(args, "wait", false)
         ) do
      {:ok, url} ->
        case Map.get(args, "suspended_user_id") do
          nil -> :ok
          user_id -> Hash.add_suspended_url(user_id, url)
        end

      :ok ->
        :ok

      {:error, reason} ->
        {:error, reason}
    end
  end
end

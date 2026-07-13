defmodule Flirtual.ObanWorkers.ProcessMatch do
  use Oban.Worker, queue: :notifications

  alias Flirtual.{Matchmaking, User}

  @impl Oban.Worker
  def perform(%Oban.Job{
        args: %{"user_id" => user_id, "target_id" => target_id, "kind" => kind}
      }) do
    user = User.get(user_id)
    target = User.get(target_id)
    kind = String.to_existing_atom(kind)

    if is_nil(user) or is_nil(target) do
      :ok
    else
      with {:ok, _} <- Matchmaking.create_match_conversation(user, target, kind),
           {:ok, _} <- Matchmaking.deliver_match_notification(target, user, kind) do
        :ok
      else
        {:error, reason} -> {:error, reason}
      end
    end
  end
end

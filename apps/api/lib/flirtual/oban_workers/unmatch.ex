defmodule Flirtual.ObanWorkers.Unmatch do
  use Oban.Worker, queue: :notifications

  import Ecto.Query

  alias Flirtual.{Repo, Talkjs}
  alias Flirtual.User.Profile.LikesAndPasses

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id, "target_id" => target_id}}) do
    # Users may have re-matched since the job was queued, so check and skip if so.
    if matched?(user_id, target_id) do
      :ok
    else
      with {:ok, _} <- Talkjs.delete_participants(user_id: user_id, target_id: target_id) do
        :ok
      end
    end
  end

  defp matched?(user_id, target_id),
    do: liked?(user_id, target_id) and liked?(target_id, user_id)

  defp liked?(profile_id, target_id) do
    LikesAndPasses
    |> where(
      [lp],
      lp.profile_id == ^profile_id and lp.target_id == ^target_id and lp.type == :like
    )
    |> Repo.exists?()
  end
end

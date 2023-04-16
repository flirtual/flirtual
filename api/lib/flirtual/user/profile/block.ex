defmodule Flirtual.User.Profile.Block do
  use Flirtual.Schema

  import Ecto.Query
  import Ecto.Changeset

  alias Flirtual.User.Profile.Prospect
  alias Flirtual.User.Profile.LikesAndPasses
  alias Flirtual.User.Profile.Block
  alias Flirtual.User.ChangeQueue
  alias Flirtual.User
  alias Flirtual.Repo

  @derive {Jason.Encoder, only: [:profile_id, :target_id, :created_at]}

  schema "blocks" do
    belongs_to :profile, Flirtual.User.Profile, references: :user_id
    belongs_to :target, Flirtual.User.Profile, references: :user_id

    timestamps(updated_at: false)
  end

  def create(user: %User{id: user_id}, target: %User{id: target_id}) do
    Repo.transaction(fn repo ->
      with {:ok, item} <-
             %Block{}
             |> change(%{profile_id: user_id, target_id: target_id})
             |> unsafe_validate_unique([:profile_id, :target_id], repo)
             |> Repo.insert(),
           {:ok, _} <- LikesAndPasses.delete_all(profile_id: user_id, target_id: target_id),
           {:ok, _} <- Prospect.delete(profile_id: user_id, target_id: target_id),
           # TODO: Remove conversations, and vice versa.
           # TODO: Add a way to add multiple items to the change queue.
           {:ok, _} <- ChangeQueue.add(user_id),
           {:ok, _} <- ChangeQueue.add(target_id) do
        item
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def get(user: %User{id: user_id}, target: %User{id: target_id}) do
    Block
    |> where(profile_id: ^user_id, target_id: ^target_id)
    |> Repo.one()
  end

  def exists?(user: %User{id: user_id}, target: %User{id: target_id}) do
    Block
    |> where(profile_id: ^user_id, target_id: ^target_id)
    |> Repo.exists?()
  end

  def delete(%Block{} = item) do
    Repo.transaction(fn ->
      with {:ok, item} <- Repo.delete(item),
           {:ok, _} <- ChangeQueue.add(item.profile_id),
           {:ok, _} <- ChangeQueue.add(item.target_id) do
        item
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end
end

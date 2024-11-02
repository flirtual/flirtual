defmodule Flirtual.User.Profile.Block do
  use Flirtual.Schema

  import Ecto.Query
  import Ecto.Changeset

  alias Flirtual.{ObanWorkers, Repo, User}
  alias Flirtual.User.Profile.{Block, LikesAndPasses, Prospect}

  @derive {Jason.Encoder, only: [:profile_id, :target_id, :created_at]}

  schema "blocks" do
    belongs_to(:profile, Flirtual.User.Profile, references: :user_id)
    belongs_to(:target, Flirtual.User.Profile, references: :user_id)

    timestamps(updated_at: false)
  end

  def create(user: %User{id: user_id}, target: %User{id: target_id}) do
    create(user_id: user_id, target_id: target_id)
  end

  def create(user_id: user_id, target_id: target_id) do
    Repo.transaction(fn repo ->
      with {:ok, item} <-
             %Block{}
             |> change(%{profile_id: user_id, target_id: target_id})
             |> unsafe_validate_unique([:profile_id, :target_id], repo)
             |> Repo.insert(),
           {:ok, _} <- LikesAndPasses.delete_all(profile_id: user_id, target_id: target_id),
           {:ok, _} <- Prospect.delete_all(profile_id: user_id, target_id: target_id),
           {:ok, _} <- ObanWorkers.update_user([user_id, target_id], [:elasticsearch, :talkjs]) do
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

  def exists?(user_id: user_id, target_id: target_id) do
    Block
    |> where(profile_id: ^user_id, target_id: ^target_id)
    |> Repo.exists?()
  end

  def delete(%Block{} = item) do
    Repo.transaction(fn ->
      with {:ok, item} <- Repo.delete(item),
           {:ok, _} <-
             ObanWorkers.update_user([item.profile_id, item.target_id], [:elasticsearch, :talkjs]) do
        item
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end
end

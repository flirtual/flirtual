defmodule Flirtual.User.Profile.LikesAndPasses do
  use Flirtual.Schema

  import Ecto.Query

  alias Flirtual.User.Profile.Block
  alias Flirtual.User.ChangeQueue
  alias Flirtual.Repo
  alias Flirtual.User.Profile.LikesAndPasses

  @derive {Jason.Encoder,
           only: [
             :id,
             :profile_id,
             :target_id,
             :type,
             :kind,
             :created_at
           ]}

  schema "likes_and_passes" do
    belongs_to :profile, Flirtual.User.Profile, references: :user_id
    belongs_to :target, Flirtual.User.Profile, references: :user_id

    belongs_to :opposite, LikesAndPasses

    field :type, Ecto.Enum, values: [:like, :pass]
    field :kind, Ecto.Enum, values: [:love, :friend]

    timestamps()
  end

  def list(profile_id: profile_id) do
    LikesAndPasses
    |> where(profile_id: ^profile_id)
    |> Repo.all()
  end

  def list_matches(profile_id: profile_id) do
    LikesAndPasses
    |> where(profile_id: ^profile_id, type: :like)
    |> where([item], not is_nil(item.opposite_id))
    |> Repo.all()
  end

  def list_unrequited(profile_id: profile_id) do
    LikesAndPasses
    |> where(target_id: ^profile_id, type: :like)
    |> where([item], is_nil(item.opposite_id))
    |> join(:left, [lap], block in Block,
      on: lap.profile_id == block.target_id and lap.target_id == block.profile_id
    )
    |> where([lap, block], is_nil(block.id))
    |> Repo.all()
  end

  def delete_all(profile_id: profile_id, target_id: target_id) do
    Repo.transaction(fn ->
      with {count, nil} <-
             LikesAndPasses
             |> where(profile_id: ^profile_id, target_id: ^target_id)
             |> Repo.delete_all(),
           {:ok, _} <- ChangeQueue.add(profile_id) do
        count
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def delete_all(profile_id: profile_id) do
    Repo.transaction(fn ->
      with {count, nil} <-
             LikesAndPasses
             |> where(profile_id: ^profile_id)
             |> Repo.delete_all(),
           {:ok, _} <- ChangeQueue.add(profile_id) do
        count
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end
end

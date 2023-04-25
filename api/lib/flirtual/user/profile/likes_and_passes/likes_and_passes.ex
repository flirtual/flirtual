defmodule Flirtual.User.Profile.LikesAndPasses do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.User.Profile.LikesAndPasses.Policy

  import Ecto.Query

  alias Flirtual.Talkjs
  alias Flirtual.User.Profile.Block
  alias Flirtual.User.ChangeQueue
  alias Flirtual.Repo
  alias Flirtual.User
  alias Flirtual.User.Profile.LikesAndPasses

  schema "likes_and_passes" do
    belongs_to :profile, Flirtual.User.Profile, references: :user_id
    belongs_to :target, Flirtual.User.Profile, references: :user_id

    belongs_to :opposite, LikesAndPasses

    field :type, Ecto.Enum, values: [:like, :pass]
    field :kind, Ecto.Enum, values: [:love, :friend]

    field :match, :boolean, virtual: true

    timestamps()
  end

  def matched?(
        %LikesAndPasses{
          opposite: %LikesAndPasses{} = opposite_item
        } = item
      ),
      do: matched?(item, opposite_item)

  def matched?(
        %LikesAndPasses{
          type: :like
        },
        %LikesAndPasses{
          type: :like
        }
      ),
      do: true

  def matched?(_, _), do: false

  def get(user: %User{id: user_id}, target: %User{id: target_id}) do
    LikesAndPasses
    |> where(profile_id: ^user_id, target_id: ^target_id)
    |> preload(:opposite)
    |> Repo.one()
  end

  def match_exists?(user: %User{id: user_id}, target: %User{id: target_id}) do
    LikesAndPasses
    |> where(profile_id: ^user_id, target_id: ^target_id)
    |> where([item], not is_nil(item.opposite_id))
    |> Repo.exists?()
  end

  def list(profile_id: profile_id) do
    LikesAndPasses
    |> where(profile_id: ^profile_id)
    |> preload(:opposite)
    |> Repo.all()
  end

  def list_matches(profile_id: profile_id) do
    LikesAndPasses
    |> where(profile_id: ^profile_id, type: :like)
    |> where([item], not is_nil(item.opposite_id))
    |> preload(:opposite)
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
    |> preload(:opposite)
    |> Repo.all()
  end

  def delete_all(profile_id: profile_id, target_id: target_id) do
    Repo.transaction(fn ->
      with {count, nil} <-
             LikesAndPasses
             |> where(profile_id: ^profile_id, target_id: ^target_id)
             |> Repo.delete_all(),
           {:ok, _} <-
             Talkjs.delete_participants(user_id: profile_id, target_id: target_id),
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
           {:ok, _} <- Talkjs.delete_user_conversations(profile_id),
           {:ok, _} <- ChangeQueue.add(profile_id) do
        count
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  defimpl Jason.Encoder do
    use Flirtual.Encoder,
      only: [
        :id,
        :profile_id,
        :target_id,
        :type,
        :opposite,
        :kind,
        :match,
        :created_at
      ]
  end
end

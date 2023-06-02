defmodule Flirtual.User.Profile.LikesAndPasses do
  use Flirtual.Schema, primary_key: false
  use Flirtual.Policy.Target, policy: Flirtual.User.Profile.LikesAndPasses.Policy

  import Ecto.Query

  alias Flirtual.User.Profile.Block
  alias Flirtual.Talkjs
  alias Flirtual.User.ChangeQueue
  alias Flirtual.Repo
  alias Flirtual.User
  alias Flirtual.User.Profile.LikesAndPasses

  schema "likes_and_passes" do
    belongs_to :profile, Flirtual.User.Profile, references: :user_id, primary_key: true
    belongs_to :target, Flirtual.User.Profile, references: :user_id, primary_key: true

    field :type, Ecto.Enum, values: [:like, :pass]
    field :kind, Ecto.Enum, values: [:love, :friend], primary_key: true

    field :opposite, :map, virtual: true
    field :match, :boolean, virtual: true
    field :active_at, :utc_datetime, virtual: true

    timestamps(updated_at: false)
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

  def get(user: %User{id: user_id}, target: %User{id: target_id}, type: type),
    do: get(user_id: user_id, target_id: target_id, type: type)

  def get(user_id: user_id, target_id: target_id, type: type) do
    LikesAndPasses
    |> where(profile_id: ^user_id, target_id: ^target_id, type: ^type)
    |> with_opposite()
    |> order_by(:type)
    |> limit(1)
    |> Repo.one()
  end

  def get(user: %User{id: user_id}, target: %User{id: target_id}) do
    LikesAndPasses
    |> where(profile_id: ^user_id, target_id: ^target_id)
    |> with_opposite()
    |> order_by(:type)
    |> limit(1)
    |> Repo.one()
  end

  def match_exists?(user: %User{id: user_id}, target: %User{id: target_id}) do
    LikesAndPasses
    |> where(profile_id: ^user_id, target_id: ^target_id)
    |> with_opposite()
    # |> where([item], not is_nil(item.opposite_id))
    |> Repo.exists?()
  end

  def list(profile_id: profile_id) do
    LikesAndPasses
    |> where(profile_id: ^profile_id)
    |> with_opposite()
    |> Repo.all()
  end

  def list_matches(profile_id: profile_id) do
    LikesAndPasses
    |> where(profile_id: ^profile_id, type: :like)
    |> with_opposite(nil: false)
    |> exclude_blocked()
    |> order_by(desc: :created_at)
    |> Repo.all()
  end

  def list_unrequited(profile_id: profile_id) do
    LikesAndPasses
    |> where(target_id: ^profile_id, type: :like)
    |> with_opposite(nil: true)
    |> exclude_blocked()
    |> join(:left, [lap, _, _], user in User, on: lap.profile_id == user.id)
    |> select_merge([lap, _, _, user], %{
      active_at: user.active_at
    })
    |> order_by(desc: :created_at)
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

  def exclude_blocked(query) do
    query
    |> join(:left, [lap, _], block in Block,
      on:
        (lap.profile_id == block.profile_id and lap.target_id == block.target_id) or
          (lap.profile_id == block.target_id and lap.target_id == block.profile_id)
    )
    |> where([lap, _, block], is_nil(block))
  end

  def with_opposite(query, options \\ []) do
    query
    |> join(:left, [lap], opposite in LikesAndPasses,
      on: lap.profile_id == opposite.target_id and lap.target_id == opposite.profile_id
    )
    |> select_merge([lap, opposite], %{
      opposite: opposite,
      match: not is_nil(opposite) and lap.type == :like and opposite.type == :like
    })
    |> then(
      &case Keyword.get(options, nil) do
        nil -> &1
        true -> where(&1, [_, opposite], is_nil(opposite))
        false -> where(&1, [_, opposite], not is_nil(opposite))
      end
    )
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

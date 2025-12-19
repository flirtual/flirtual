defmodule Flirtual.User.Profile.LikesAndPasses do
  use Flirtual.Schema, primary_key: false
  use Flirtual.Policy.Target, policy: Flirtual.User.Profile.LikesAndPasses.Policy

  import Ecto.Query

  alias Flirtual.{ObanWorkers, Repo, Talkjs, User}
  alias Flirtual.User.Profile.{Block, LikesAndPasses}

  schema "likes_and_passes" do
    belongs_to(:profile, Flirtual.User.Profile, references: :user_id, primary_key: true)
    belongs_to(:target, Flirtual.User.Profile, references: :user_id, primary_key: true)

    field(:type, Ecto.Enum, values: [:like, :pass])
    field(:kind, Ecto.Enum, values: [:love, :friend], primary_key: true)

    field(:opposite, :map, virtual: true)
    field(:match, :boolean, virtual: true)

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

  def get(user_id: user_id, target_id: target_id) do
    LikesAndPasses
    |> where(profile_id: ^user_id, target_id: ^target_id)
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

  def list_unrequited(profile_id: profile_id, cursor: cursor) do
    query =
      LikesAndPasses
      |> where(target_id: ^profile_id, type: :like)
      |> with_opposite(nil: true)
      |> exclude_blocked()
      |> join(:left, [lap, _, _], user in User, on: lap.profile_id == user.id)
      |> where([_, _, _, user], user.status == :visible)
      |> order_by([lap], desc: lap.created_at, desc: lap.profile_id)

    query =
      if cursor.before && cursor.before_id do
        before_datetime = DateTime.from_unix!(cursor.before, :millisecond)

        where(
          query,
          [lap],
          lap.created_at < ^before_datetime or
            (lap.created_at == ^before_datetime and lap.profile_id < ^cursor.before_id)
        )
      else
        query
      end

    items =
      query
      |> limit(^cursor.limit)
      |> Repo.all()

    {items, LikesAndPasses.Cursor.map(cursor, items)}
  end

  def list_unrequited(profile_id: profile_id, since: since) do
    subquery =
      from(lap in LikesAndPasses,
        where:
          lap.target_id == ^profile_id and
            lap.type == :like and
            lap.created_at >= ^since,
        group_by: [lap.profile_id, lap.target_id],
        select: %{
          profile_id: lap.profile_id,
          target_id: lap.target_id,
          latest_created_at: max(lap.created_at)
        }
      )

    query =
      from(lap in subquery(subquery),
        left_join: opposite in LikesAndPasses,
        on:
          lap.profile_id == opposite.target_id and
            lap.target_id == opposite.profile_id,
        left_join: block in Block,
        on:
          lap.profile_id == block.profile_id and
            lap.target_id == block.target_id,
        left_join: user in User,
        on: lap.profile_id == user.id,
        where:
          is_nil(opposite) and
            is_nil(block) and
            user.status == :visible,
        select: lap.profile_id,
        order_by: [desc: lap.latest_created_at]
      )

    Repo.all(query)
  end

  def count_unrequited(profile_id: profile_id) do
    LikesAndPasses
    |> where(target_id: ^profile_id, type: :like)
    |> join(:left, [lap], opposite in LikesAndPasses,
      on: lap.profile_id == opposite.target_id and lap.target_id == opposite.profile_id
    )
    |> where([_, opposite], is_nil(opposite))
    |> join(:left, [lap, _], block in Block,
      on:
        (lap.profile_id == block.profile_id and lap.target_id == block.target_id) or
          (lap.profile_id == block.target_id and lap.target_id == block.profile_id)
    )
    |> where([_, _, block], is_nil(block))
    |> join(:left, [lap, _, _], user in User, on: lap.profile_id == user.id)
    |> where([_, _, _, user], user.status == :visible)
    |> group_by([lap], lap.kind)
    |> select([lap], {lap.kind, count(lap.profile_id)})
    |> Repo.all()
    |> Map.new()
  end

  def delete_unrequited_likes(profile_id: profile_id) do
    Repo.transaction(fn ->
      liked_users =
        LikesAndPasses
        |> where(profile_id: ^profile_id, type: :like)
        |> join(:left, [lap], opposite in LikesAndPasses,
          on: lap.target_id == opposite.profile_id and lap.profile_id == opposite.target_id
        )
        |> where([_, opposite], is_nil(opposite) or opposite.type != :like)
        |> select([lap, _], lap.target_id)
        |> Repo.all()

      with {count, nil} <-
             LikesAndPasses
             |> where(profile_id: ^profile_id, type: :like)
             |> where([lap], lap.target_id in ^liked_users)
             |> Repo.delete_all(),
           {:ok, _} <- ObanWorkers.update_user(profile_id, [:elasticsearch, :refresh_prospects]) do
        count
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end

  def delete_passes(profile_id: profile_id) do
    Repo.transaction(fn ->
      with {count, nil} <-
             LikesAndPasses
             |> where(profile_id: ^profile_id, type: :pass)
             |> Repo.delete_all(),
           {:ok, _} <- ObanWorkers.update_user(profile_id, [:elasticsearch, :refresh_prospects]) do
        count
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def delete_all(profile_id: profile_id, target_id: target_id) do
    Repo.transaction(fn ->
      with {count, nil} <-
             LikesAndPasses
             |> where(profile_id: ^profile_id, target_id: ^target_id)
             |> Repo.delete_all(),
           {:ok, _} <-
             Talkjs.delete_participants(user_id: profile_id, target_id: target_id) do
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
    |> order_by([lap, opposite], desc: opposite.type == :like)
    |> then(
      &case Keyword.get(options, nil) do
        nil -> &1
        true -> where(&1, [_, opposite], is_nil(opposite))
        false -> where(&1, [_, opposite], not is_nil(opposite))
      end
    )
  end

  defmodule Cursor do
    import Flirtual.Utilities

    alias Flirtual.User.Profile.LikesAndPasses.Cursor

    @derive [{Jason.Encoder, only: [:page, :limit]}]
    defstruct before: nil, before_id: nil, page: 0, limit: 20

    def map(self, data) do
      %{
        next: self |> next(data) |> encode(),
        page: self.page
      }
      |> exclude_nil()
    end

    def first(), do: %Cursor{}

    def encode(nil), do: nil

    def encode(%Cursor{page: page} = cursor)
        when is_integer(page) and page > 0 do
      :erlang.term_to_binary(
        {
          cursor.before,
          cursor.before_id,
          cursor.page,
          cursor.limit
        },
        [:compressed]
      )
      |> Base.url_encode64()
    end

    def encode(_), do: nil

    def decode(token) when is_binary(token) do
      with {:ok, binary} <- Base.url_decode64(token),
           {before, before_id, page, limit}
           when (is_nil(before) or is_integer(before)) and
                  (is_nil(before_id) or is_binary(before_id)) and
                  is_integer(page) and is_integer(limit) <-
             :erlang.binary_to_term(binary, [:safe]) do
        %Cursor{
          before: before,
          before_id: before_id,
          page: page,
          limit: limit
        }
      else
        _ -> first()
      end
    end

    def decode(_), do: first()

    def next(_, []), do: nil

    def next(%Cursor{} = self, data) do
      if length(data) == self.limit do
        last_item = List.last(data)

        %Cursor{
          before: DateTime.to_unix(last_item.created_at, :millisecond),
          before_id: last_item.profile_id,
          page: self.page + 1
        }
      else
        nil
      end
    end
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

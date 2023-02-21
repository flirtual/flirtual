defmodule Flirtual.Elastic.User do
  import Ecto.Query

  alias Ecto.Changeset
  alias Flirtual.Elastic
  alias Flirtual.Elastic.DirtyUsersQueue
  alias Flirtual.Repo
  alias Flirtual.User
  alias Flirtual.User.Profile

  def assoc() do
    User.default_assoc() ++
      [
        profile: [
          liked:
            from(profile in Profile,
              join: like in Profile.Likes,
              join: target_profile in Profile,
              on: [id: like.target_id],
              select: target_profile.user_id
            ),
          passed:
            from(profile in Profile,
              join: pass in Profile.Passes,
              join: target_profile in Profile,
              on: [id: pass.target_id],
              select: target_profile.user_id
            ),
          blocked:
            from(profile in Profile,
              join: block in Profile.Blocks,
              join: target_profile in Profile,
              on: [id: block.target_id],
              select: target_profile.user_id
            )
        ]
      ]
  end

  def update_pending(limit \\ 100) do
    Repo.transaction(fn ->
      from(item in DirtyUsersQueue,
        limit: ^limit,
        join: user in assoc(item, :user),
        preload: [user: ^User.default_assoc()]
      )
      |> Repo.all()
      |> Enum.map(fn item ->
        document_id = item.user.id
        type =
          if(User.visible?(item.user),
            do:
              case Elastic.get_document("users", document_id) do
                {:ok, _} -> :update
                _ -> :create
              end,
            else: :delete
          )

        {
          type,
          document_id,
          Elasticsearch.Document.encode(item.user)
        }
      end)
      |> then(fn changes ->
        total_changes = length(changes)
        IO.inspect(total_changes)

        if total_changes != 0 do
          Elastic.bulk_changes("users", changes)

          user_ids = Enum.map(changes, fn {_, user_id, _} -> user_id end)
          clear_dirty_marks(user_ids)
        end

        total_changes
      end)
    end)
  end

  def mark_dirty(user_id) do
    DirtyUsersQueue
    |> query_by_user_id(user_id)
    |> Repo.one()
    |> then(&if(is_nil(&1), do: %DirtyUsersQueue{}, else: &1))
    |> Changeset.change(%{user_id: user_id})
    |> Repo.insert_or_update()
  end

  def clear_dirty_marks(user_ids) do
    if(length(user_ids) != 0,
      do: DirtyUsersQueue |> query_by_user_ids(user_ids) |> Repo.delete_all(),
      else: {0, nil}
    )
  end

  def update(%User{} = user) do
    Elasticsearch.put_document(Flirtual.Elastic, user, "users")
  end

  def search(query) do
    with {:ok, resp} <- Elasticsearch.post(Flirtual.Elastic, "/users/_search", query) do
      resp["hits"]["hits"]
    end
  end

  def query_by_user_id(query, user_id) do
    query |> where([queue_item], queue_item.user_id == ^user_id)
  end

  def query_by_user_ids(query, user_ids) do
    query |> where([queue_item], queue_item.user_id in ^user_ids)
  end
end

defimpl Elasticsearch.Document, for: Flirtual.User do
  alias Flirtual.Elastic
  alias Flirtual.User
  alias Flirtual.Repo

  def id(%User{} = user), do: user.id
  def routing(_), do: false

  def encode(%User{} = user) do
    user = user |> Repo.preload(Elastic.User.assoc())
    profile = user.profile

    document =
      Map.merge(
        %{
          id: user.id,
          dob: user.born_at,
          agemin: profile.preferences.agemin,
          agemax: profile.preferences.agemax,
          openness: profile.openness,
          conscientiousness: profile.conscientiousness,
          agreeableness: profile.agreeableness,
          gender: profile.gender |> Enum.map(& &1.id),
          gender_lf: profile.preferences.gender |> Enum.map(& &1.id),
          custom_interests: [],
          default_interests:
            profile.interests
            |> Enum.filter(&(!&1.metadata))
            |> Enum.map(& &1.id),
          strong_interests:
            profile.interests
            |> Enum.filter(&(&1.metadata && &1.metadata["strength"] == 1))
            |> Enum.map(& &1.id),
          stronger_interests:
            profile.interests
            |> Enum.filter(&(&1.metadata && &1.metadata["strength"] == 2))
            |> Enum.map(& &1.id),
          games: profile.games |> Enum.map(& &1.id),
          country: profile.country,
          monopoly: profile.monopoly,
          serious: profile.serious,
          nsfw: user.preferences.nsfw,
          liked: profile.liked,
          passed: profile.passed,
          blocked: profile.blocked
        },
        if(user.preferences.nsfw,
          do: %{
            domsub: user.profile.domsub,
            kinks: user.profile.kinks |> Enum.map(& &1.id),
            kinks_lf: user.profile.preferences.kinks |> Enum.map(& &1.id)
          },
          else: %{}
        )
      )

    document
  end
end

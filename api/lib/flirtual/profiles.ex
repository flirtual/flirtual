defmodule Flirtual.Profiles do
  import Ecto.Query
  import Ecto.Changeset

  alias Ecto.UUID
  alias Flirtual.{Repo}
  alias Flirtual.User.{Profile}
  alias Flirtual.User.Profile.{Image}

  def get(id) when is_binary(id) do
    Profile
    |> query_by_id(id)
    |> preload(^Profile.default_assoc())
    |> Repo.one()
  end

  def get_by_user_id(user_id) when is_binary(user_id) do
    Profile
    |> query_by_user_id(user_id)
    |> preload(^Profile.default_assoc())
    |> Repo.one()
  end

  def get_personality_by_user_id(user_id)
      when is_binary(user_id) do
    Profile
    |> query_by_user_id(user_id)
    |> select([profile], map(profile, ^Profile.get_personality_questions()))
    |> Repo.one()
  end

  def update_personality(%Profile{} = profile, attrs) do
    profile
    |> cast(
      attrs,
      [:openness, :conscientiousness, :agreeableness] ++ Profile.get_personality_questions()
    )
    |> compute_personality_changeset()
    |> Repo.update()
  end

  defp compute_personality_changeset(changeset) do
    changeset
    |> change(%{openness: 0, conscientiousness: 0, agreeableness: 0})
    |> compute_personality_changeset(:question0, :openness, :add)
    |> compute_personality_changeset(:question1, :openness, :add)
    |> compute_personality_changeset(:question2, :openness, :sub)
    |> compute_personality_changeset(:question3, :conscientiousness, :add)
    |> compute_personality_changeset(:question4, :conscientiousness, :add)
    |> compute_personality_changeset(:question5, :conscientiousness, :sub)
    |> compute_personality_changeset(:question6, :agreeableness, :add)
    |> compute_personality_changeset(:question7, :agreeableness, :add)
    |> compute_personality_changeset(:question8, :agreeableness, :sub)
  end

  defp compute_personality_changeset(changeset, key, trait, action) do
    answer = get_field(changeset, key)

    if(answer !== nil) do
      trait_value = get_field(changeset, trait)

      new_trait_value =
        if(answer) do
          # if they answered yes, apply the increase to the relevant trait.
          if(action === :add, do: trait_value + 1, else: trait_value - 1)
        else
          # if the answered no, apply the inverse.
          if(action === :sub, do: trait_value + 1, else: trait_value - 1)
        end

      changeset
      |> put_change(trait, new_trait_value)
    else
      changeset
    end
  end

  def update(%Profile{} = profile, attrs) do
    profile
    |> Profile.update_changeset(attrs)
    |> Repo.update()
  end

  def update_preferences(%Profile.Preferences{} = preferences, attrs) do
    preferences
    |> Profile.Preferences.update_changeset(attrs)
    |> Repo.update()
  end

  def create_images(%Profile{} = profile, file_ids) do
    placeholders = %{
      now: NaiveDateTime.truncate(NaiveDateTime.utc_now(), :second),
      profile_id: profile.id
    }

    image_count = Kernel.length(profile.images) || 0

    {_, images} =
      Repo.insert_all(
        Image,
        file_ids
        |> Enum.with_index()
        |> Enum.map(fn {file_id, file_idx} ->
          %{
            id: UUID.generate(),
            profile_id: {:placeholder, :profile_id},
            external_id: file_id,
            order: image_count + file_idx,
            updated_at: {:placeholder, :now},
            created_at: {:placeholder, :now}
          }
        end),
        placeholders: placeholders,
        returning: true
      )

    {:ok, images}
  end

  def update_images(%Profile{} = profile, image_ids) do
    changesets =
      profile.images
      |> Enum.map(fn image ->
        new_order = Enum.find_index(image_ids, &(&1 === image.id))
        change(image, order: new_order)
      end)

      Repo.transaction(fn repo ->
        changesets |> Enum.map(fn changeset ->
          if (get_field(changeset, :order) !== nil) do
            changeset |> repo.update!()
          else
            changeset |> repo.delete!()
          end
        end)
      end)

    {:ok, Enum.map(changesets, &apply_changes/1)}
  end

  def query_by_id(query, id) do
    query |> where([profile], profile.id == ^id)
  end

  def query_by_user_id(query, user_id) do
    query |> where([profile], profile.user_id == ^user_id)
  end
end

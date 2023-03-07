defmodule Flirtual.Profiles do
  import Ecto.Query
  import Ecto.Changeset

  import Flirtual.Utilities.Changeset
  import Flirtual.Utilities

  alias Flirtual.Attribute
  alias Ecto.UUID
  alias Flirtual.{Repo, Elastic}
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
    Repo.transaction(fn ->
      with {:ok, profile} <-
             profile
             |> Profile.update_personality_changeset(attrs)
             |> Repo.update(),
           {:ok, _} <- Elastic.User.mark_dirty(profile.user_id) do
        profile
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def update(%Profile{} = profile, attrs, options \\ []) do
    Repo.transaction(fn ->
      with {:ok, profile} <-
             Profile.changeset(profile, attrs, options)
             |> Repo.update(),
           {:ok, _} <- Elastic.User.mark_dirty(profile.user_id) do
        profile
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def update_preferences(%Profile.Preferences{} = preferences, attrs, options \\ []) do
    Repo.transaction(fn ->
      with {:ok, preferences} <-
             preferences
             |> Profile.Preferences.changeset(attrs, options)
             |> Repo.update(),
           {:ok, _} <-
             Repo.preload(preferences, profile: from(profile in Profile, select: profile.user_id))
             |> then(&Elastic.User.mark_dirty(&1.profile)) do
        preferences
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def update_custom_weights(%Profile.CustomWeights{} = custom_weights, attrs) do
    custom_weights
    |> Profile.CustomWeights.changeset(attrs)
    |> Repo.insert_or_update()
  end

  def create_images(%Profile{} = profile, file_ids) do
    Repo.transaction(fn ->
      placeholders = %{
        now: NaiveDateTime.truncate(NaiveDateTime.utc_now(), :second),
        profile_id: profile.id
      }

      image_count = Kernel.length(profile.images)

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

      Enum.map(images, &%Image{&1 | profile: profile})
    end)
  end

  def update_images(%Profile{} = profile, image_ids) do
    Repo.transaction(fn repo ->
      with {:ok, _} <-
             cast_arbitrary(
               %{
                 image_ids: {:array, :string}
               },
               %{image_ids: image_ids}
             )
             |> validate_uuids(:image_ids)
             |> validate_length(:image_ids, min: 1, max: 16)
             |> apply_action(:update),
           images <-
             Enum.map(profile.images, fn image ->
               new_order = Enum.find_index(image_ids, &(&1 === image.id))

               change(image, order: new_order)
               |> then(fn changeset ->
                 with {:ok, image} <-
                        if(get_field(changeset, :order) !== nil,
                          do: changeset |> repo.update(),
                          else: changeset |> repo.delete()
                        ) do
                   image
                 else
                   {:error, reason} -> Repo.rollback(reason)
                   reason -> Repo.rollback(reason)
                 end
               end)
             end)
             |> Enum.filter(&(&1.order !== nil)) do
        images
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def query_by_id(query, id) do
    query |> where(id: ^id)
  end

  def query_by_user_id(query, user_id) do
    query |> where(user_id: ^user_id)
  end
end
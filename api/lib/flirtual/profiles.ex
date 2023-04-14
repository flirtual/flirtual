defmodule Flirtual.Profiles do
  import Ecto.Query
  import Ecto.Changeset

  import Flirtual.Utilities.Changeset

  alias Flirtual.User.ChangeQueue
  alias Ecto.UUID
  alias Flirtual.{Repo}
  alias Flirtual.User.{Profile}
  alias Flirtual.User.Profile.{Image}

  def get_personality_by_user_id(user_id)
      when is_binary(user_id) do
    Profile
    |> where(user_id: ^user_id)
    |> select([profile], map(profile, ^Profile.get_personality_questions()))
    |> Repo.one()
  end

  def update_personality(%Profile{} = profile, attrs) do
    Repo.transaction(fn ->
      with {:ok, profile} <-
             profile
             |> Profile.update_personality_changeset(attrs)
             |> Repo.update(),
           {:ok, _} <- ChangeQueue.add(profile.user_id) do
        profile
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  defmodule Update do
    use Flirtual.EmbeddedSchema

    import Flirtual.Utilities
    import Flirtual.Attribute

    alias Flirtual.User.Profile
    alias Flirtual.Languages
    alias Flirtual.Countries

    @attribute_keys [
      :gender_id,
      :sexuality_id,
      :kink_id,
      :game_id,
      :platform_id,
      :interest_id
    ]

    @attribute_types @attribute_keys
                     |> Enum.map(fn key ->
                       key
                       |> Atom.to_string()
                       |> String.replace_suffix("_id", "")
                       |> to_atom()
                     end)

    @optional [
                :display_name,
                :biography,
                :domsub,
                :monopoly,
                :country,
                :serious,
                :new,
                :languages,
                :custom_interests
              ] ++ @attribute_keys ++ @attribute_types

    embedded_schema do
      field :display_name, :string
      field :biography, :string
      field :domsub, :string
      field :monopoly, :string
      field :country, :string
      field :serious, :boolean
      field :new, :boolean
      field :languages, {:array, :string}
      field :custom_interests, {:array, :string}

      @attribute_keys |> Enum.map(fn key -> field(key, {:array, :string}) end)
      @attribute_types |> Enum.map(fn key -> field(key, {:array, :string}, virtual: true) end)
    end

    def changeset(value, _, %{required: required}) do
      value
      |> validate_required(required || [])
      |> validate_length(:display_name, min: 3, max: 32)
      |> validate_length(:biography, min: 48, max: 4096)
      |> validate_length(:languages, min: 1, max: 5)
      |> validate_subset(:languages, Languages.list(:iso_639_1),
        message: "has an unrecognized language"
      )
      |> validate_inclusion(:country, ["none" | Countries.list(:iso_3166_1)],
        message: "is an unrecognized country"
      )
      |> validate_inclusion(:domsub, ["none" | Ecto.Enum.values(Profile, :domsub)])
      |> validate_inclusion(:monopoly, ["none" | Ecto.Enum.values(Profile, :monopoly)])
      |> validate_attributes(:gender_id, "gender")
      |> validate_length(:gender_id, min: 1, max: 4)
      |> validate_attributes(:sexuality_id, "sexuality")
      |> validate_length(:sexuality, max: 3)
      |> validate_attributes(:kink_id, "kink")
      |> validate_length(:kink, min: 0, max: 8)
      |> validate_attributes(:game_id, "game")
      |> validate_length(:game, min: 1, max: 5)
      |> validate_attributes(:platform_id, "platform")
      |> validate_length(:platform, min: 1, max: 8)
      |> validate_attributes(:interest_id, "interest")
      |> then(fn changeset ->
        if not changed?(changeset, :interest_id) or not changed?(changeset, :custom_interests) do
          changeset
        else
          interests =
            (get_field(changeset, :interest) || []) ++
              (get_field(changeset, :custom_interests) || [])

          changeset
          |> put_change(:interest, interests)
          |> delete_change(:custom_interests)
        end
      end)
      |> validate_length(:interest, min: 1, max: 7)
    end

    def transform_value(value, default) do
      if value === "none" do
        nil
      else
        value || default
      end
    end

    def transform(profile, attrs) do
      profile
      |> change(%{
        display_name: transform_value(attrs.display_name, profile.display_name),
        biography: transform_value(attrs.biography, profile.biography),
        serious: transform_value(attrs.serious, profile.serious),
        new: transform_value(attrs.new, profile.new),
        country: transform_value(attrs.country, profile.country),
        domsub: transform_value(attrs.domsub, profile.domsub),
        monopoly: transform_value(attrs.monopoly, profile.monopoly),
        languages: transform_value(attrs.languages, profile.languages),
        custom_interests:
          if not is_nil(attrs.interest) do
            attrs.interest
            |> Enum.filter(&is_binary(&1))
          else
            nil
          end ||
            profile.custom_interests,
        attributes:
          [
            @attribute_types
            |> Enum.map(fn key ->
              (attrs[key] || profile.attributes |> filter_by(:type, key |> Atom.to_string()))
              |> Enum.filter(&(not is_binary(&1)))
            end)
          ]
          |> List.flatten()
      })
    end
  end

  def update(%Profile{} = profile, attrs, options \\ []) do
    Repo.transaction(fn ->
      with {:ok, attrs} <-
             Update.apply(attrs, context: %{required: Keyword.get(options, :required, [])}),
           {:ok, profile} <- Update.transform(profile, attrs) |> Repo.update(),
           {:ok, _} <- ChangeQueue.add(profile.user_id) do
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
           {:ok, _} <- ChangeQueue.add(preferences.profile_id) do
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
        now: DateTime.truncate(DateTime.utc_now(), :second),
        profile_id: profile.user_id
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
             |> Enum.filter(&(&1.order !== nil)),
           {:ok, _} <- ChangeQueue.add(profile.user_id) do
        images
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end
end

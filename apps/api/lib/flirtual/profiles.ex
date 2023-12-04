defmodule Flirtual.Profiles do
  import Ecto.Query
  import Ecto.Changeset

  import Flirtual.Utilities.Changeset

  alias Flirtual.{Flag, Hash, ObanWorkers, Repo}
  alias Flirtual.User.Profile
  alias Flirtual.User.Profile.Image

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
           {:ok, _} <- ObanWorkers.update_user(profile.user_id, [:elasticsearch, :premium_reset]) do
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

    alias Flirtual.Countries
    alias Flirtual.Languages
    alias Flirtual.Profiles.Update
    alias Flirtual.User.Profile

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
                :vrchat,
                :discord,
                :languages,
                :custom_interests
              ] ++ @attribute_keys ++ @attribute_types

    embedded_schema do
      field(:display_name, :string)
      field(:biography, :string)
      field(:vrchat, :string, default: "")
      field(:discord, :string, default: "")
      field(:domsub, Ecto.Enum, values: [:none | Ecto.Enum.values(Profile, :domsub)])
      field(:monopoly, Ecto.Enum, values: [:none | Ecto.Enum.values(Profile, :monopoly)])
      field(:country, Ecto.Enum, values: [:none | Countries.list(:iso_3166_1)])
      field(:serious, :boolean)
      field(:new, :boolean)
      field(:languages, {:array, Ecto.Enum}, values: Languages.list(:bcp_47))
      field(:custom_interests, {:array, :string})

      @attribute_keys |> Enum.map(fn key -> field(key, {:array, :string}) end)
      @attribute_types |> Enum.map(fn key -> field(key, {:array, :string}, virtual: true) end)
    end

    def create(%{profile: profile}) do
      %Update{
        display_name: profile.display_name,
        biography: profile.biography,
        vrchat: profile.vrchat,
        discord: profile.discord,
        domsub: profile.domsub,
        monopoly: profile.monopoly,
        country: profile.country,
        serious: profile.serious,
        new: profile.new,
        languages: if(profile.languages === [], do: nil, else: profile.languages),
        custom_interests: profile.custom_interests
      }
    end

    def changeset(value, _, %{required: required}) do
      value
      |> validate_required(required || [])
      |> validate_length(:display_name, min: 3, max: 32)
      |> validate_length(:biography, min: 48, max: 10_000)
      |> validate_length(:languages, min: 1, max: 5)
      |> validate_attributes(:gender_id, "gender")
      |> validate_length(:gender, min: 1, max: 4)
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
        if not changed?(changeset, :interest_id) and not changed?(changeset, :custom_interests) do
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
      if value === :none do
        nil
      else
        if is_nil(value) do
          default
        else
          value
        end
      end
    end

    def transform(profile, attrs) do
      profile
      |> change(%{
        display_name: transform_value(attrs.display_name, profile.display_name),
        biography: transform_value(attrs.biography, profile.biography),
        serious: transform_value(attrs.serious, profile.serious),
        vrchat: transform_value(attrs.vrchat, profile.vrchat),
        discord: transform_value(attrs.discord, profile.discord),
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
             Update.apply(attrs,
               context: %{
                 profile: profile,
                 required: Keyword.get(options, :required, [])
               }
             ),
           {:ok, profile} <-
             Update.transform(profile, attrs |> Map.from_struct()) |> Repo.update(),
           {:ok, _} <- ObanWorkers.update_user(profile.user_id),
           :ok <-
             Flag.check_flags(
               profile.user_id,
               Enum.join(
                 Enum.filter(
                   [profile.display_name, profile.vrchat, profile.discord, profile.biography] ++
                     (profile.custom_interests || []),
                   & &1
                 ),
                 " "
               )
             ),
           :ok <- Flag.check_openai_moderation(profile.user_id, profile.biography),
           :ok <- Hash.check_hash(profile.user_id, "display name", profile.display_name),
           :ok <- Hash.check_hash(profile.user_id, "VRChat", profile.vrchat),
           :ok <- Hash.check_hash(profile.user_id, "Discord", profile.discord) do
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
             ObanWorkers.update_user(preferences.profile_id, [:elasticsearch, :premium_reset]) do
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

  defmodule UpdateColors do
    use Flirtual.EmbeddedSchema

    embedded_schema do
      field(:color_1, :string)
      field(:color_2, :string)
    end

    def changeset(value, _, _) do
      value
      |> validate_format(:color_1, ~r/^#[0-9a-f]{6}$/i)
      |> validate_format(:color_2, ~r/^#[0-9a-f]{6}$/i)
      |> put_change(:color_1, String.downcase(get_change(value, :color_1)))
      |> put_change(:color_2, String.downcase(get_change(value, :color_2)))
      |> then(fn changeset ->
        case changeset do
          %Ecto.Changeset{changes: %{color_1: "#ff8975", color_2: "#e9658b"}} ->
            change(changeset, %{color_1: nil, color_2: nil})

          %Ecto.Changeset{changes: %{color_1: "#b24592", color_2: "#e9658b"}} ->
            change(changeset, %{color_1: nil, color_2: nil})

          _ ->
            changeset
        end
      end)
    end
  end

  def update_colors(%Profile{} = profile, attrs) do
    Repo.transaction(fn ->
      with {:ok, attrs} <- UpdateColors.apply(attrs),
           profile
           |> change(%{color_1: attrs.color_1, color_2: attrs.color_2})
           |> Repo.update() do
        profile
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
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
              id: Ecto.ShortUUID.generate(),
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
                 images: {:array, :string}
               },
               %{images: image_ids}
             )
             |> validate_uids(:images)
             |> validate_length(:images, min: 1, max: 16)
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
           {:ok, _} <-
             ObanWorkers.update_user(profile.user_id, [:elasticsearch, :talkjs]) do
        images
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end
end

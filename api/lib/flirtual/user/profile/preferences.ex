defmodule Flirtual.User.Profile.Preferences do
  use Flirtual.Schema

  import Ecto.Changeset

  alias Flirtual.User.Profile
  alias Flirtual.Attribute

  schema "user_profile_preferences" do
    belongs_to :profile, Profile

    field :agemin, :integer
    field :agemax, :integer

    many_to_many :gender, Attribute,
      join_through: "user_profile_preference_attributes",
      where: [type: "gender"],
      on_replace: :delete

    many_to_many :kinks, Attribute,
      join_through: "user_profile_preference_attributes",
      where: [type: "kink"],
      on_replace: :delete

    timestamps(inserted_at: false)
  end

  def default_assoc do
    [
      :gender,
      :kinks
    ]
  end

  def update_changeset(%Profile.Preferences{} = preferences, attrs) do
    gender_ids = attrs["gender"] || Enum.map(preferences.gender, & &1.id)
    genders = Attribute.by_ids(gender_ids, "gender")

    kink_ids = attrs["kinks"] || Enum.map(preferences.kinks, & &1.id)
    kinks = Attribute.by_ids(kink_ids, "kink")

    preferences
    |> cast(attrs, [
      :agemin,
      :agemax,
    ])
    |> put_assoc(:gender, genders)
    |> validate_length(:gender, min: 1, max: 3)
    |> put_assoc(:kinks, kinks)
  end
end


defimpl Jason.Encoder, for: Flirtual.User.Profile.Preferences do
  def encode(value, opts) do
    Jason.Encode.map(
      Map.take(value, [
        :agemin,
        :agemax,
        :gender,
        :kinks
      ])
      |> Map.filter(fn {_, value} -> value !== nil end),
      opts
    )
  end
end

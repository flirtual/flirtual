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
      join_through: "user_profile_attributes",
      join_keys: [profile_id: :profile_id, attribute_id: :id],
      where: [type: "gender"],
      on_replace: :delete

    timestamps(inserted_at: false)
  end

  def default_assoc do
    [
      :gender,
    ]
  end

  def update_changeset(%Profile.Preferences{} = preferences, attrs) do
    preferences
    |> cast(attrs, [
      :agemin,
      :agemax,
    ])
  end
end


defimpl Jason.Encoder, for: Flirtual.User.Profile.Preferences do
  def encode(value, opts) do
    Jason.Encode.map(
      Map.take(value, [
        :agemin,
        :agemax,
        :gender
      ])
      |> Map.filter(fn {_, value} -> value !== nil end),
      opts
    )
  end
end

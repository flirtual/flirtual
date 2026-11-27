defmodule Flirtual.User.Profile.Preferences do
  use Flirtual.Schema, primary_key: false

  use Flirtual.Policy.Target, policy: Flirtual.User.Profile.Preferences.Policy

  import Ecto.Changeset

  alias Flirtual.User.Profile

  alias Flirtual.Data.{Gender, Kink}

  schema "profile_preferences" do
    belongs_to :profile, Profile, primary_key: true, references: :user_id

    field :agemin, :integer
    field :agemax, :integer

    field :genders, Flirtual.Entries, of: Gender, default: []
    field :kinks, Flirtual.Entries, of: Kink, default: []
  end

  def default_assoc, do: []

  def tags(%Profile.Preferences{} = preferences),
    do: preferences.genders ++ preferences.kinks

  def changeset(%Profile.Preferences{} = preferences, attrs, options \\ []) do
    cast(preferences, attrs, [
      :agemin,
      :agemax,
      :genders
    ])
    |> validate_required(Keyword.get(options, :required, []))
    |> validate_number(:agemin, greater_than_or_equal_to: 18, less_than_or_equal_to: 128)
    |> validate_number(:agemax, greater_than_or_equal_to: 18, less_than_or_equal_to: 128)
    |> validate_length(:genders, min: 1, max: 3)
  end
end

defimpl Jason.Encoder, for: Flirtual.User.Profile.Preferences do
  use Flirtual.Encoder,
    only: [
      :agemin,
      :agemax,
      :genders,
      :kinks
    ]
end

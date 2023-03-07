defmodule Flirtual.User.Profile.Preferences do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.User.Profile.Preferences.Policy

  import Flirtual.Attribute, only: [validate_attribute_list: 5]

  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.User.Profile
  alias Flirtual.Attribute

  schema "user_profile_preferences" do
    belongs_to :profile, Profile

    field :agemin, :integer
    field :agemax, :integer

    many_to_many :attributes, Attribute,
      join_through: "user_profile_preference_attributes",
      on_replace: :delete

    timestamps(inserted_at: false)
  end

  def default_assoc do
    [
      attributes:
        from(attribute in Attribute,
          order_by: [attribute.type, attribute.id]
        )
    ]
  end

  def changeset(%Profile.Preferences{} = preferences, attrs, options \\ []) do
    cast(preferences, attrs, [
      :agemin,
      :agemax
    ])
    |> validate_number(:agemin, greater_than_or_equal_to: 18, less_than_or_equal_to: 128)
    |> validate_number(:agemax, greater_than_or_equal_to: 18, less_than_or_equal_to: 128)
    |> validate_attribute_list(
      attrs["attributes"],
      [
        :gender,
        :kink
      ],
      &(&1
        |> validate_length(:gender, min: 1, max: 3)),
      required: Keyword.get(options, :required_attributes, [])
    )
  end
end

defimpl Jason.Encoder, for: Flirtual.User.Profile.Preferences do
  def encode(value, opts) do
    Jason.Encode.map(
      Map.take(value, [
        :agemin,
        :agemax,
        :attributes
      ])
      |> Map.filter(fn {_, value} -> value !== nil end),
      opts
    )
  end
end

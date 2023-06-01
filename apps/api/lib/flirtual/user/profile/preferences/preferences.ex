defmodule Flirtual.User.Profile.Preferences do
  use Flirtual.Schema, primary_key: false

  use Flirtual.Policy.Target, policy: Flirtual.User.Profile.Preferences.Policy

  import Flirtual.Attribute, only: [validate_attribute_list: 5]

  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.User.Profile.Preferences
  alias Flirtual.User.Profile
  alias Flirtual.Attribute

  schema "profile_preferences" do
    belongs_to :profile, Profile, primary_key: true, references: :user_id

    field :agemin, :integer
    field :agemax, :integer

    many_to_many :attributes, Attribute,
      join_through: Preferences.Attributes,
      join_keys: [preferences_id: :profile_id, attribute_id: :id],
      on_replace: :delete,
      preload_order: [asc: :type, asc: :order, asc: :name]
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
    |> validate_required(Keyword.get(options, :required, []))
    |> validate_number(:agemin, greater_than_or_equal_to: 18, less_than_or_equal_to: 128)
    |> validate_number(:agemax, greater_than_or_equal_to: 18, less_than_or_equal_to: 128)
    |> validate_attribute_list(
      attrs["attributes"] || attrs[:attributes],
      [
        :gender
      ],
      &(&1
        |> validate_length(:gender, min: 1, max: 3)),
      required: Keyword.get(options, :required_attributes, [])
    )
  end
end

defimpl Jason.Encoder, for: Flirtual.User.Profile.Preferences do
  use Flirtual.Encoder,
    only: [
      :agemin,
      :agemax,
      :attributes
    ]
end

defmodule Flirtual.User.Profile.Preferences do
  use Flirtual.Schema

  import Flirtual.Utilities
  import Flirtual.Utilities.Changeset
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
          select: %{id: attribute.id, type: attribute.type},
          order_by: [attribute.type, attribute.id]
        )
    ]
  end

  def changeset(%Profile.Preferences{} = preferences, attrs) do
    attributes =
      Attribute.by_ids(
        [
          attrs["gender"] || Enum.map(preferences.gender, & &1.id),
          attrs["kinks"] || Enum.map(preferences.kinks, & &1.id)
        ],
        :type
      )

    cast(preferences, attrs, [])
    |> append_changeset(
      cast_arbitrary(
        %{
          agemin: :integer,
          agemax: :integer,
          gender: {:array, :string},
          kinks: {:array, :string}
        },
        attrs
      )
      |> validate_number(:agemin, greater_than_or_equal_to: 18, less_than_or_equal_to: 128)
      |> validate_number(:agemax, greater_than_or_equal_to: 18, less_than_or_equal_to: 128)
      |> validate_length(:gender, min: 1, max: 3),
      &map_exclude_keys(&1, [:gender, :kinks])
    )
    |> put_assoc(:gender, attributes["gender"] || [])
    |> put_assoc(:kinks, attributes["kinks"] || [])
  end
end

defimpl Jason.Encoder, for: Flirtual.User.Profile.Preferences do
  def encode(value, opts) do
    Jason.Encode.map(
      Map.take(value, [
        :agemin,
        :agemax,
        :attributes,
      ])
      |> Map.filter(fn {_, value} -> value !== nil end),
      opts
    )
  end
end

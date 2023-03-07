defmodule Flirtual.User.Profile do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.User.Profile.Policy

  import Flirtual.Attribute, only: [validate_attribute_list: 5]

  import Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.Countries
  alias Flirtual.Languages
  alias Flirtual.{Attribute, User}
  alias Flirtual.User.Profile
  alias Flirtual.User.Profile.{Image, Preferences, CustomWeights}

  @personality_questions [
    :question0,
    :question1,
    :question2,
    :question3,
    :question4,
    :question5,
    :question6,
    :question7,
    :question8
  ]

  def get_personality_questions() do
    @personality_questions
  end

  @domsub_values [:dominant, :submissive, :switch]
  @monopoly_values [:monogamous, :polygamous]

  def get_domsub_opposite(domsub) do
    case domsub do
      :dominant -> :submissive
      :submissive -> :dominant
      :switch -> :switch
    end
  end

  def get_domsub_match(domsub) do
    case domsub do
      :switch -> [:switch]
      _ -> [get_domsub_opposite(domsub), :switch]
    end
  end

  def group_interests_by_strength(interests) do
    interests
    |> Enum.map(&if(!&1.metadata, do: %{&1 | metadata: %{"strength" => 0}}, else: &1))
    |> Enum.group_by(& &1.metadata["strength"])
  end

  schema "user_profiles" do
    belongs_to :user, User

    field :display_name, :string
    field :biography, :string
    field :domsub, Ecto.Enum, values: @domsub_values
    field :monopoly, Ecto.Enum, values: @monopoly_values
    field :country, :string
    field :openness, :integer, default: 0
    field :conscientiousness, :integer, default: 0
    field :agreeableness, :integer, default: 0
    Enum.map(@personality_questions, &field(&1, :boolean))
    field :serious, :boolean
    field :new, :boolean
    field :languages, {:array, :string}
    field :custom_interests, {:array, :string}

    has_one :preferences, Preferences
    has_one :custom_weights, CustomWeights

    many_to_many :attributes, Attribute,
      join_through: "user_profile_attributes",
      on_replace: :delete

    has_many :images, Image
    many_to_many :blocked, Profile, join_through: Profile.Blocks
    many_to_many :liked_and_passed, Profile, join_through: Profile.LikesAndPasses

    timestamps(inserted_at: false)
  end

  def default_assoc do
    [
      :custom_weights,
      attributes: from(attribute in Attribute, order_by: [attribute.type, attribute.id]),
      preferences: Preferences.default_assoc(),
      images: from(image in Image, order_by: image.order)
    ]
  end

  def changeset(%Profile{} = profile, attrs, options \\ []) do
    cast(profile, attrs, [
      :display_name,
      :biography,
      :serious,
      :new,
      :country,
      :domsub,
      :monopoly,
      :languages,
      :custom_interests
    ])
    |> validate_length(:display_name, min: 3, max: 32)
    |> validate_length(:biography, min: 48)
    |> validate_length(:languages, min: 1, max: 3)
    |> validate_subset(:languages, Languages.list(:iso_639_1),
      message: "has an unrecognized language"
    )
    |> validate_inclusion(:country, Countries.list(:iso_3166_1),
      message: "is an unrecognized country"
    )
    |> validate_subset(:domsub, @domsub_values)
    |> validate_subset(:monopoly, @monopoly_values)
    |> validate_attribute_list(
      attrs["attributes"],
      [
        :gender,
        :sexuality,
        :kink,
        :game,
        :platform,
        :interest
      ],
      &(&1
        |> validate_length(:gender, min: 1, max: 4)
        |> validate_length(:sexuality, min: 1, max: 3)
        |> validate_length(:kink, min: 1, max: 8)
        |> validate_length(:game, min: 1, max: 5)
        |> validate_length(:platform, min: 1, max: 8)
        |> validate_length(:interest, min: 2, max: 7)),
      required: Keyword.get(options, :required_attributes, [])
    )
  end

  def update_personality_changeset(changeset, attrs) do
    changeset
    |> cast(
      attrs,
      [:openness, :conscientiousness, :agreeableness] ++
        Profile.get_personality_questions()
    )
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
end

defimpl Jason.Encoder, for: Flirtual.User.Profile do
  def encode(value, opts) do
    Jason.Encode.map(
      Map.take(value, [
        :display_name,
        :biography,
        :new,
        :domsub,
        :monopoly,
        :country,
        :serious,
        :openness,
        :conscientiousness,
        :agreeableness,
        :attributes,
        :languages,
        :custom_interests,
        :preferences,
        :custom_weights,
        :images,
        :updated_at
      ])
      |> Map.filter(fn {_, value} -> value !== nil end),
      opts
    )
  end
end
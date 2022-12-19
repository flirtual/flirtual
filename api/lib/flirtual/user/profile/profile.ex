defmodule Flirtual.User.Profile do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.User.Profile.Policy

  import Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.Countries
  alias Flirtual.Languages
  alias Flirtual.{Attribute, User}
  alias Flirtual.User.Profile.{Image, Preferences, CustomWeights, Likes}

  @kink_pairs [
    [:brat_tamer, :brat],
    [:owner, :pet],
    [:daddy_mommy, :boy_girl],
    [:master_mistress, :slave],
    [:rigger, :rope_bunny],
    [:sadist, :masochist],
    [:exhibitionist, :voyeur],
    [:hunter, :prey],
    [:degrader, :degradee],
    [:ageplayer, :ageplayer],
    [:experimentalist, :experimentalist]
  ]

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

  def get_kink_pairs() do
    @kink_pairs
  end

  def get_kink_list() do
    @kink_pairs |> List.flatten() |> Enum.uniq()
  end

  schema "user_profiles" do
    belongs_to :user, User

    field :display_name, :string
    field :biography, :string
    field :country, :string
    field :openness, :integer, default: 0
    field :conscientiousness, :integer, default: 0
    field :agreeableness, :integer, default: 0
    Enum.map(@personality_questions, &field(&1, :boolean))
    field :new, :boolean
    field :languages, {:array, :string}

    has_one :preferences, Preferences
    has_one :custom_weights, CustomWeights

    many_to_many :gender, Attribute,
      join_through: "user_profile_attributes",
      where: [type: "gender"],
      on_replace: :delete

    many_to_many :sexuality, Attribute,
      join_through: "user_profile_attributes",
      where: [type: "sexuality"],
      on_replace: :delete

    many_to_many :kinks, Attribute,
      join_through: "user_profile_attributes",
      where: [type: "kink"],
      on_replace: :delete

    many_to_many :platforms, Attribute,
      join_through: "user_profile_attributes",
      where: [type: "platform"],
      on_replace: :delete

    many_to_many :interests, Attribute,
      join_through: "user_profile_attributes",
      where: [type: "interest"],
      on_replace: :delete

    many_to_many :games, Attribute,
      join_through: "user_profile_attributes",
      where: [type: "game"],
      on_replace: :delete

    has_many :images, Image
    many_to_many :likes, User, join_through: Likes

    timestamps(inserted_at: false)
  end

  def default_assoc do
    [
      :custom_weights,
      :gender,
      :sexuality,
      :kinks,
      :platforms,
      :interests,
      :games,
      preferences: Flirtual.User.Profile.Preferences.default_assoc(),
      images: from(image in Image, order_by: image.order)
    ]
  end

  def update_changeset(%User.Profile{} = profile, attrs) do
    sexuality_ids = attrs["sexuality"] || Enum.map(profile.sexuality, &(&1.id))
    sexualities = Attribute.by_ids(sexuality_ids, "sexuality")

    kink_ids = attrs["kinks"] || Enum.map(profile.kinks, &(&1.id))
    kinks = Attribute.by_ids(kink_ids, "kink")

    gender_ids = attrs["gender"] || Enum.map(profile.gender, &(&1.id))
    genders = Attribute.by_ids(gender_ids, "gender")

    game_ids = attrs["games"] || Enum.map(profile.games, &(&1.id))
    games = Attribute.by_ids(game_ids, "game")

    platform_ids = attrs["platforms"] || Enum.map(profile.platforms, &(&1.id))
    platforms = Attribute.by_ids(platform_ids, "platform")

    interest_ids = attrs["interests"] || Enum.map(profile.interests, &(&1.id))
    interests = Attribute.by_ids(interest_ids, "interest")

    profile
    |> cast(attrs, [
      :display_name,
      :biography,
      :new,
      :country,
      :languages
    ])
    |> put_assoc(:gender, genders)
    |> validate_length(:gender, min: 1, max: 4)
    |> put_assoc(:sexuality, sexualities)
    |> validate_length(:sexuality, min: 1, max: 3)
    |> put_assoc(:kinks, kinks)
    |> validate_length(:kinks, min: 0, max: 8)
    |> put_assoc(:games, games)
    |> validate_length(:games, min: 1, max: 5)
    |> put_assoc(:platforms, platforms)
    |> validate_length(:platforms, min: 1, max: 8)
    |> put_assoc(:interests, interests)
    |> validate_length(:interests, min: 2, max: 7)
    |> validate_length(:display_name, min: 3, max: 32)
    |> validate_length(:biography, min: 16)
    |> validate_length(:languages, min: 1, max: 3)
    |> validate_subset(:languages, Languages.list(:iso_639_1), message: "has an unrecognized language")
    |> validate_inclusion(:country, Countries.list(:iso_3166_1), message: "is an unrecognized country")
  end
end

defimpl Jason.Encoder, for: Flirtual.User.Profile do
  def encode(value, opts) do
    Jason.Encode.map(
      Map.take(value, [
        :display_name,
        :biography,
        :new,
        :country,
        :openness,
        :conscientiousness,
        :agreeableness,
        :gender,
        :sexuality,
        :kinks,
        :games,
        :languages,
        :platforms,
        :interests,
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

defmodule Flirtual.User.Profile do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.User.Profile.Policy

  import Ecto.Changeset

  alias Flirtual.User
  alias Flirtual.User.Profile.{Image, Preferences, CustomWeights, Likes}

  @genders [
    :woman,
    :man,
    :she_her,
    :he_him,
    :they_them,
    :agender,
    :androgynous,
    :bigender,
    :cis_woman,
    :cis_man,
    :genderfluid,
    :genderqueer,
    :gender_nonconforming,
    :hijra,
    :intersex,
    :non_binary,
    :pangender,
    :transgender,
    :transsexual,
    :trans_woman,
    :trans_man,
    :transfeminine,
    :transmasculine,
    :two_spirit,
    :other
  ]
  @sexualities [
    :straight,
    :lesbian,
    :gay,
    :bisexual,
    :pansexual,
    :asexual,
    :demisexual,
    :heteroflexible,
    :homoflexible,
    :queer,
    :questioning,
    :experimenting_in_vr
  ]

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

  @derive {Jason.Encoder,
           only: [
             :display_name,
             :biography,
             :country,
             :openness,
             :conscientiousness,
             :agreeableness,
             :gender,
             :sexuality,
             :games,
             :languages,
             :platforms,
             :interests,
             :preferences,
             :custom_weights,
             :images,
             :updated_at
           ]}

  schema "user_profiles" do
    belongs_to :user, User

    field :display_name, :string
    field :biography, :string
    field :country, :string
    field :openness, :integer, default: 0
    field :conscientiousness, :integer, default: 0
    field :agreeableness, :integer, default: 0
    Enum.map(@personality_questions, &(field(&1, :boolean)))
    field :gender, {:array, Ecto.Enum}, values: @genders
    field :sexuality, {:array, Ecto.Enum}, values: @sexualities
    field :games, {:array, :string}
    field :languages, {:array, :string}
    field :platforms, {:array, :string}
    field :interests, {:array, :string}

    has_one :preferences, Preferences
    has_one :custom_weights, CustomWeights

    has_many :images, Image
    many_to_many :likes, User, join_through: Likes

    timestamps(inserted_at: false)
  end

  def default_assoc do
    [
      :preferences,
      :custom_weights,
      :images
    ]
  end

  def update_changeset(%User.Profile{} = profile, attrs) do
    profile
    |> cast(attrs, [
      :display_name,
      :biography,
      :country,
      :gender,
      :sexuality,
      :games,
      :languages,
      :platforms,
      :interests
    ])
    |> validate(:display_name)
    |> validate(:biography)
    |> validate(:gender)
    |> validate(:sexuality)
    |> validate(:games)
    |> validate(:languages)
    |> validate(:platforms)
    |> validate(:interests)
  end

  def validate(%Ecto.Changeset{} = changeset, :display_name = key) do
    changeset |> validate_length(key, min: 3, max: 32)
  end

  def validate(%Ecto.Changeset{} = changeset, :biography = key) do
    changeset |> validate_length(key, min: 16)
  end

  def validate(%Ecto.Changeset{} = changeset, :gender = key) do
    changeset |> validate_length(key, min: 1)
  end

  def validate(%Ecto.Changeset{} = changeset, :sexuality = key) do
    changeset |> validate_length(key, min: 1, max: 3)
  end

  def validate(%Ecto.Changeset{} = changeset, :games = key) do
    changeset |> validate_length(key, min: 1, max: 5)
  end

  def validate(%Ecto.Changeset{} = changeset, :languages = key) do
    changeset |> validate_length(key, min: 1, max: 3)
  end

  def validate(%Ecto.Changeset{} = changeset, :platforms = key) do
    changeset |> validate_length(key, min: 1, max: 8)
  end

  def validate(%Ecto.Changeset{} = changeset, :interests = key) do
    changeset |> validate_length(key, min: 2, max: 7)
  end
end

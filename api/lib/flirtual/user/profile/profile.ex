defmodule Flirtual.User.Profile do
  use Flirtual.Schema

  alias Flirtual.User
  alias Flirtual.User.Profile.{Images, Preferences, CustomWeights, Likes}

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
    field :gender, {:array, Ecto.Enum}, values: @genders
    field :sexuality, {:array, Ecto.Enum}, values: @sexualities
    field :games, {:array, :string}
    field :languages, {:array, :string}
    field :platforms, {:array, :string}
    field :interests, {:array, :string}

    has_one :preferences, Preferences
    has_one :custom_weights, CustomWeights

    has_many :images, Images
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
end

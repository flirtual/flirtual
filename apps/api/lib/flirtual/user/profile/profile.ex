defmodule Flirtual.User.Profile do
  use Flirtual.Schema, primary_key: false
  use Flirtual.Policy.Target, policy: Flirtual.User.Profile.Policy

  import Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.User
  alias Flirtual.User.Profile
  alias Flirtual.User.Profile.{AdvancedFilter, CustomWeights, Image, Preferences, Prompt}

  alias Flirtual.Data.{
    Country,
    Game,
    Gender,
    Interest,
    Kink,
    Language,
    Platform,
    Relationship,
    Sexuality
  }

  @derive {Inspect,
           only: [
             :user_id,
             :display_name
           ]}

  @tags [
    genders: Gender,
    sexualities: Sexuality,
    interests: Interest,
    games: Game,
    platforms: Platform,
    kinks: Kink
  ]
  @tag_fields Keyword.keys(@tags)

  def tag_fields, do: @tag_fields

  def tags(%Profile{} = profile),
    do: Enum.flat_map(@tag_fields, &Map.fetch!(profile, &1))

  def pronoun?(%Flirtual.Data.Gender{pronoun: true}), do: true
  def pronoun?(_), do: false

  def reject_pronouns(tags) when is_list(tags), do: Enum.reject(tags, &pronoun?/1)

  def normalize_aliases(tags) when is_list(tags), do: resolve(tags, :alias_of)

  def normalize_pairs(tags) when is_list(tags), do: resolve(tags, :pair)

  defp resolve(tags, field) do
    tags
    |> Enum.map(fn tag ->
      case Map.get(tag, field) do
        id when is_binary(id) -> tag.__struct__.get(id)
        nil -> tag
      end
    end)
    |> Enum.uniq_by(& &1.id)
  end

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
  @monopoly_values [:monogamous, :nonmonogamous]

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
    |> Enum.group_by(&(&1.strength || 0))
  end

  def fuzz_personality_key(profile, key) do
    if(not is_nil(profile[key]) and profile[key] !== 0,
      do: if(profile[key] > 0, do: 1, else: -1),
      else: nil
    )
  end

  # Fuzz to prevent inferring original personality question answers.
  def fuzz_personality(profile) do
    profile
    |> Map.put(:openness, fuzz_personality_key(profile, :openness))
    |> Map.put(:conscientiousness, fuzz_personality_key(profile, :conscientiousness))
    |> Map.put(:agreeableness, fuzz_personality_key(profile, :agreeableness))
  end

  schema "profiles" do
    belongs_to(:user, User, primary_key: true)

    field(:display_name, :string)
    field(:biography, :string)
    field(:domsub, Ecto.Enum, values: @domsub_values)
    field(:monopoly, Ecto.Enum, values: @monopoly_values)
    field(:country, Flirtual.Entry, of: Country)
    field(:openness, :integer)
    field(:conscientiousness, :integer)
    field(:agreeableness, :integer)
    Enum.map(@personality_questions, &field(&1, :boolean))
    field(:relationships, Flirtual.Entries, of: Relationship, default: [])
    field(:new, :boolean)

    field(:languages, Flirtual.Entries, of: Language, default: [])

    field(:timezone, Ecto.Enum,
      values: TzExtra.time_zone_ids(include_aliases: true) |> Enum.map(&String.to_atom/1)
    )

    field(:longitude, :float)
    field(:latitude, :float)
    field(:custom_interests, {:array, :string})

    field(:vrchat, :string)
    field(:vrchat_name, :string)
    field(:discord, :string)
    field(:facetime, :string)
    field(:playlist, :string)

    field(:color_1, :string)
    field(:color_2, :string)

    has_one(:preferences, Preferences, references: :user_id, foreign_key: :profile_id)
    has_one(:custom_weights, CustomWeights, references: :user_id, foreign_key: :profile_id)

    for {field, module} <- @tags, do: field(field, Flirtual.Entries, of: module, default: [])

    has_many(:advanced_filters, AdvancedFilter, references: :user_id, foreign_key: :profile_id)
    has_many(:images, Image, references: :user_id, foreign_key: :profile_id)

    has_many(:prompts, Prompt,
      references: :user_id,
      foreign_key: :profile_id,
      preload_order: [asc: :order]
    )

    many_to_many(:blocked, Profile,
      join_through: Profile.Block,
      join_keys: [profile_id: :user_id, target_id: :user_id]
    )

    many_to_many(:liked_and_passed, Profile,
      join_through: Profile.LikesAndPasses,
      join_keys: [profile_id: :user_id, target_id: :user_id]
    )

    timestamps(inserted_at: false)
  end

  def default_assoc do
    [
      :custom_weights,
      :advanced_filters,
      preferences: Preferences.default_assoc(),
      images: from(image in Image, order_by: image.order),
      prompts: Prompt.default_assoc()
    ]
  end

  @trait_questions [
    openness: [question0: :add, question1: :add, question2: :sub],
    conscientiousness: [question3: :add, question4: :add, question5: :sub],
    agreeableness: [question6: :add, question7: :add, question8: :sub]
  ]

  def update_personality_changeset(changeset, attrs) do
    changeset = cast(changeset, attrs, Profile.get_personality_questions())

    Enum.reduce(@trait_questions, changeset, fn {trait, questions}, changeset ->
      put_change(changeset, trait, trait_score(changeset, questions))
    end)
  end

  defp trait_score(changeset, questions) do
    questions
    |> Enum.flat_map(fn {question, action} ->
      case get_field(changeset, question) do
        nil -> []
        answer -> [if(answer == (action == :add), do: 1, else: -1)]
      end
    end)
    |> case do
      [] -> nil
      scores -> Enum.sum(scores)
    end
  end
end

defimpl Jason.Encoder, for: Flirtual.User.Profile do
  use Flirtual.Encoder,
    only: [
      :display_name,
      :biography,
      :new,
      :domsub,
      :monopoly,
      :country,
      :relationships,
      :openness,
      :conscientiousness,
      :agreeableness,
      :genders,
      :sexualities,
      :interests,
      :games,
      :platforms,
      :kinks,
      :languages,
      :timezone,
      :longitude,
      :latitude,
      :custom_interests,
      :preferences,
      :custom_weights,
      :advanced_filters,
      :vrchat,
      :vrchat_name,
      :discord,
      :facetime,
      :playlist,
      :images,
      :prompts,
      :color_1,
      :color_2,
      :updated_at
    ]
end

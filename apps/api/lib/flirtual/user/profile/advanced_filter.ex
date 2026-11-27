defmodule Flirtual.User.Profile.AdvancedFilter do
  use Flirtual.Schema, primary_key: false

  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.{Entitlement, Repo}
  alias Flirtual.User.Profile.AdvancedFilter

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

  @categories [
    :gender,
    :sexuality,
    :relationships,
    :monopoly,
    :interest,
    :game,
    :platform,
    :personality,
    :domsub,
    :country,
    :language,
    :kink
  ]
  @entry_categories %{
    gender: Gender,
    sexuality: Sexuality,
    interest: Interest,
    game: Game,
    platform: Platform,
    kink: Kink
  }
  @max_per_kind 30

  @monopoly_values ~w(monogamous nonmonogamous)
  @personality_values ~w(openminded practical reliable freespirited friendly straightforward)
  @domsub_values ~w(dominant submissive switch)

  @derive {Jason.Encoder, only: [:kind, :category, :value]}

  schema "profile_advanced_filters" do
    belongs_to(:profile, Flirtual.User.Profile, references: :user_id)

    field(:kind, Ecto.Enum, values: [:include, :exclude])
    field(:category, Ecto.Enum, values: @categories)
    field(:value, :string)

    timestamps(updated_at: false)
  end

  # Never shrinks, so existing filters still load.
  def categories, do: @categories

  def entry_module(category), do: @entry_categories[category]

  def enabled_categories do
    if(Flirtual.Features.advanced_filters?(), do: @categories, else: [])
    |> reject_disabled(Flirtual.Features.vr_tags?(), [:game, :platform])
    |> reject_disabled(Flirtual.Features.personality?(), [:personality])
  end

  defp reject_disabled(categories, true, _disabled), do: categories
  defp reject_disabled(categories, false, disabled), do: categories -- disabled
  def max_per_kind, do: @max_per_kind

  def list(profile_id: profile_id) do
    AdvancedFilter
    |> where(profile_id: ^profile_id)
    |> order_by(asc: :kind, asc: :category)
    |> Repo.all()
  end

  def changeset(%AdvancedFilter{} = filter, attrs, %{user: user}) do
    filter
    |> cast(attrs, [:kind, :category, :value])
    |> validate_required([:kind, :category])
    |> validate_required([:value])
    |> validate_value()
    |> validate_premium(user)
  end

  defp validate_value(changeset) do
    value = get_field(changeset, :value)

    case get_field(changeset, :category) do
      :country ->
        validate_inclusion(changeset, :value, Country.ids())

      :language ->
        validate_inclusion(changeset, :value, Language.ids())

      category when is_map_key(@entry_categories, category) ->
        if is_nil(@entry_categories[category].get(value)),
          do: add_error(changeset, :value, "invalid_value"),
          else: changeset

      :relationships ->
        validate_inclusion(changeset, :value, Relationship.ids())

      :monopoly ->
        validate_inclusion(changeset, :value, @monopoly_values)

      :personality ->
        validate_inclusion(changeset, :value, @personality_values)

      :domsub ->
        validate_inclusion(changeset, :value, @domsub_values)

      _ ->
        changeset
    end
    |> then(fn changeset ->
      if is_nil(value) or is_map_key(@entry_categories, get_field(changeset, :category)),
        do: changeset,
        else: update_change(changeset, :value, &String.downcase/1)
    end)
  end

  defp validate_premium(changeset, user) do
    if Entitlement.premium?(user.entitlements) do
      changeset
    else
      category = get_field(changeset, :category)
      value = get_field(changeset, :value)

      allowed =
        case category do
          :gender ->
            true

          :language ->
            true

          :interest ->
            match?(
              %Interest{category: "popular"},
              Interest.get(value)
            )

          :platform ->
            match?(%Platform{kind: "headset"}, Platform.get(value))

          _ ->
            false
        end

      if allowed do
        changeset
      else
        add_error(changeset, :category, "premium_required")
      end
    end
  end
end

defmodule Flirtual.User.Profile.AdvancedFilter do
  use Flirtual.Schema, primary_key: false

  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.{Attribute, Countries, Entitlement, Languages, Repo}
  alias Flirtual.User.Profile.AdvancedFilter

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
  @attribute_categories [
    :gender,
    :sexuality,
    :interest,
    :game,
    :platform,
    :kink
  ]
  @value_categories [
    :country,
    :language,
    :relationships,
    :monopoly,
    :personality,
    :domsub
  ]
  @max_per_kind 25

  @relationship_values ~w(serious vr hookups friends)
  @monopoly_values ~w(monogamous nonmonogamous)
  @personality_values ~w(openminded practical reliable freespirited friendly straightforward)
  @domsub_values ~w(dominant submissive switch)

  @popular_interest_category "iiCe39JvGQAAtsrTqnLddb"

  @derive {Jason.Encoder, only: [:kind, :category, :attribute_id, :value]}

  schema "profile_advanced_filters" do
    belongs_to(:profile, Flirtual.User.Profile, references: :user_id)
    belongs_to(:attribute, Attribute)

    field(:kind, Ecto.Enum, values: [:include, :exclude])
    field(:category, Ecto.Enum, values: @categories)
    field(:value, :string)

    timestamps(updated_at: false)
  end

  def categories, do: @categories
  def attribute_categories, do: @attribute_categories
  def max_per_kind, do: @max_per_kind

  def list(profile_id: profile_id) do
    AdvancedFilter
    |> where(profile_id: ^profile_id)
    |> order_by(asc: :kind, asc: :category)
    |> preload(:attribute)
    |> Repo.all()
  end

  def changeset(%AdvancedFilter{} = filter, attrs, %{user: user, attributes: attributes}) do
    filter
    |> cast(attrs, [:kind, :category, :attribute_id, :value])
    |> validate_required([:kind, :category])
    |> validate_category_fields()
    |> validate_value()
    |> validate_attribute(attributes)
    |> validate_premium(user, attributes)
  end

  defp validate_category_fields(changeset) do
    category = get_field(changeset, :category)

    cond do
      category in @attribute_categories ->
        changeset
        |> validate_required([:attribute_id])
        |> put_change(:value, nil)

      category in @value_categories ->
        changeset
        |> validate_required([:value])
        |> put_change(:attribute_id, nil)

      true ->
        changeset
    end
  end

  defp validate_value(changeset) do
    value = get_field(changeset, :value)

    case get_field(changeset, :category) do
      :country ->
        validate_inclusion(
          changeset,
          :value,
          Countries.list(:iso_3166_1) |> Enum.map(&to_string/1)
        )

      :language ->
        validate_inclusion(changeset, :value, Languages.list(:bcp_47) |> Enum.map(&to_string/1))

      :relationships ->
        validate_inclusion(changeset, :value, @relationship_values)

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
      if is_nil(value), do: changeset, else: update_change(changeset, :value, &String.downcase/1)
    end)
  end

  defp validate_attribute(changeset, attributes) do
    category = get_field(changeset, :category)
    attribute_id = get_field(changeset, :attribute_id)

    if category in @attribute_categories and not is_nil(attribute_id) do
      case Map.get(attributes, attribute_id) do
        %Attribute{type: type} ->
          if type == to_string(category) do
            changeset
          else
            add_error(changeset, :attribute_id, "invalid_attribute_category")
          end

        _ ->
          add_error(changeset, :attribute_id, "invalid_attribute")
      end
    else
      changeset
    end
  end

  defp validate_premium(changeset, user, attributes) do
    if Entitlement.premium?(user.entitlements) do
      changeset
    else
      category = get_field(changeset, :category)
      attribute_id = get_field(changeset, :attribute_id)

      allowed =
        case category do
          :gender ->
            true

          :language ->
            true

          :interest ->
            attribute_metadata(attributes, attribute_id)["category"] ==
              @popular_interest_category

          :platform ->
            attribute_metadata(attributes, attribute_id)["kind"] == "headset"

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

  defp attribute_metadata(attributes, attribute_id) do
    case Map.get(attributes, attribute_id) do
      %Attribute{metadata: metadata} -> metadata || %{}
      _ -> %{}
    end
  end
end

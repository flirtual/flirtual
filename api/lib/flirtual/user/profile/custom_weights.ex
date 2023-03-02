defmodule Flirtual.User.Profile.CustomWeights do
  use Flirtual.Schema

  import Ecto.Changeset
  alias Flirtual.User.Profile

  @derive {Jason.Encoder,
           only: [
             :country,
             :monopoly,
             :games,
             :default_interests,
             :custom_interests,
             :personality,
             :serious,
             :domsub,
             :kinks,
             :likes
           ]}

  schema "user_profile_custom_weights" do
    belongs_to :profile, Profile

    field :country, :float, default: 1.0
    field :monopoly, :float, default: 1.0
    field :games, :float, default: 1.0
    field :default_interests, :float, default: 1.0
    field :custom_interests, :float, default: 1.0
    field :personality, :float, default: 1.0
    field :serious, :float, default: 1.0
    field :domsub, :float, default: 1.0
    field :kinks, :float, default: 1.0
    field :likes, :float, default: 1.0
  end

  def changeset(%Profile.CustomWeights{} = custom_weights, attrs) do
    cast(custom_weights, attrs, [
      :country,
      :monopoly,
      :games,
      :default_interests,
      :custom_interests,
      :personality,
      :serious,
      :domsub,
      :kinks,
      :likes
    ])
    |> validate(:country)
    |> validate(:monopoly)
    |> validate(:games)
    |> validate(:default_interests)
    |> validate(:custom_interests)
    |> validate(:personality)
    |> validate(:serious)
    |> validate(:domsub)
    |> validate(:kinks)
    |> validate(:likes)
  end

  defp validate(changeset, name) do
    changeset
    |> validate_number(name, greater_than_or_equal_to: 0, less_than_or_equal_to: 2)
    |> validate_number_divisible(name, 0.25)
    # note to self: maybe field level access checks like this
    # shouldn't be in the changeset since we don't
    # have access to the full user object.
    |> validate_change(name, fn _, _ ->
      if name !== :country do
        [{name, "requires premium to change"}]
      else
        []
      end
    end)
  end

  defp validate_number_divisible(changeset, name, denominator) do
    validate_change(changeset, name, fn _, value ->
      if Float.ratio(value / denominator) |> elem(1) !== 1 do
        [{name, "must be divisible by " <> to_string(denominator)}]
      else
        []
      end
    end)
  end
end

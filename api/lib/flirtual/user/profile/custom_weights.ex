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

  def update_changeset(%Profile.CustomWeights{} = custom_weights, attrs) do
    custom_weights
    |> cast(attrs, [
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
  end
end

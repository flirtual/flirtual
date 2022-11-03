defmodule Flirtual.User.Profile.CustomWeights do
  use Flirtual.Schema

  alias Flirtual.User.Profile

  schema "user_profile_custom_weights" do
    belongs_to :profile, Profile

    field :country, :integer, default: 1
    field :monopoly, :integer, default: 1
    field :games, :integer, default: 1
    field :default_interests, :integer, default: 1
    field :custom_interests, :integer, default: 1
    field :personality, :integer, default: 1
    field :serious, :integer, default: 1
    field :domsub, :integer, default: 1
    field :kinks, :integer, default: 1
    field :likes, :integer, default: 1
  end
end

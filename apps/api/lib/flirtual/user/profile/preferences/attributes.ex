defmodule Flirtual.User.Profile.Preferences.Attributes do
  use Flirtual.Schema, primary_key: false

  alias Flirtual.Attribute
  alias Flirtual.User.Profile.Preferences

  schema "profile_preference_attributes" do
    belongs_to :preferences, Preferences, references: :profile_id, primary_key: true
    belongs_to :attribute, Attribute, references: :id, primary_key: true
  end
end

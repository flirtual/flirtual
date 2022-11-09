defmodule Flirtual.User.Preferences.Privacy do
  use Flirtual.Schema

  alias Flirtual.User.Preferences

  @privacy_enum_values [:everyone, :matches, :me]
  @derive {Jason.Encoder,
           only: [:analytics, :personality, :connections, :sexuality, :country, :kinks]}

  schema "user_preference_privacy" do
    belongs_to :preferences, Preferences

    field :analytics, :boolean, default: true
    field :personality, Ecto.Enum, values: @privacy_enum_values, default: :everyone
    field :connections, Ecto.Enum, values: @privacy_enum_values, default: :everyone
    field :sexuality, Ecto.Enum, values: @privacy_enum_values, default: :everyone
    field :country, Ecto.Enum, values: @privacy_enum_values, default: :everyone
    field :kinks, Ecto.Enum, values: @privacy_enum_values, default: :everyone
  end
end

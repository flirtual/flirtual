defmodule Flirtual.User.Preferences.Privacy do
  use Flirtual.Schema, primary_key: false
  import Ecto.Changeset

  alias Flirtual.User.Preferences

  @privacy_enum_values [:everyone, :matches, :me]
  @derive {Jason.Encoder,
           only: [:analytics, :personality, :connections, :sexuality, :country, :kinks]}

  schema "preferences_privacy" do
    belongs_to :preferences, Preferences,
      primary_key: true,
      references: :user_id

    field :analytics, :boolean, default: true
    field :personality, Ecto.Enum, values: @privacy_enum_values, default: :everyone
    field :connections, Ecto.Enum, values: @privacy_enum_values, default: :matches
    field :sexuality, Ecto.Enum, values: @privacy_enum_values, default: :everyone
    field :country, Ecto.Enum, values: @privacy_enum_values, default: :everyone
    field :kinks, Ecto.Enum, values: @privacy_enum_values, default: :everyone
  end

  def get_possible_values(), do: @privacy_enum_values

  def update_changeset(%Preferences.Privacy{} = privacy, attrs) do
    privacy
    |> cast(attrs, [
      :analytics,
      :personality,
      :connections,
      :sexuality,
      :country,
      :kinks
    ])
    |> validate_option(:personality)
    |> validate_option(:connections)
    |> validate_option(:sexuality)
    |> validate_option(:country)
    |> validate_option(:kinks)
  end

  def validate_option(changeset, key) do
    changeset |> validate_inclusion(key, @privacy_enum_values)
  end
end

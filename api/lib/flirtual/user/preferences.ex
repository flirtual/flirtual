defmodule Flirtual.User.Preferences do
  use Flirtual.Schema

  alias Flirtual.User
  alias Flirtual.User.Preferences.{EmailNotifications,Privacy}

  schema "user_preferences" do
    belongs_to :user, User

    has_one :email_notifications, EmailNotifications
    has_one :privacy, Privacy
  end
end

defmodule Flirtual.User.Preferences.EmailNotifications do
  use Ecto.Schema

  alias Flirtual.User.Preferences

  schema "user_preference_email_notifications" do
    belongs_to :preferences, Preferences

    field :matches, :boolean, default: true
    field :messages, :boolean, default: true
    field :likes, :boolean, default: true
    field :newsletter, :boolean, default: true
  end
end

defmodule Flirtual.User.Preferences.Privacy do
  use Ecto.Schema

  alias Flirtual.User.Preferences

  @privacy_enum_values [:everyone, :matches, :me]

  schema "user_preference_privacy" do
    belongs_to :preferences, Preferences

    field :analytics, :boolean, default: true
    field :personality, Ecto.Enum, [values: @privacy_enum_values, default: :everyone]
    field :connections, Ecto.Enum, [values: @privacy_enum_values, default: :everyone]
    field :sexuality, Ecto.Enum, [values: @privacy_enum_values, default: :everyone]
    field :country, Ecto.Enum, [values: @privacy_enum_values, default: :everyone]
    field :kinks, Ecto.Enum, [values: @privacy_enum_values, default: :everyone]
  end
end

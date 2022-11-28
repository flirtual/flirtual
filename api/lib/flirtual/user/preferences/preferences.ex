defmodule Flirtual.User.Preferences do
  use Flirtual.Schema

  import Ecto.Changeset

  alias Flirtual.User
  alias Flirtual.User.Preferences
  alias Flirtual.User.Preferences.{EmailNotifications, Privacy}

  @derive {Jason.Encoder, only: [:email_notifications, :privacy]}

  schema "user_preferences" do
    belongs_to :user, User

    has_one :email_notifications, EmailNotifications
    has_one :privacy, Privacy
  end

  def default_assoc do
    [
      :email_notifications,
      :privacy
    ]
  end
end

defmodule Flirtual.User.Preferences.EmailNotifications do
  use Flirtual.Schema

  import Ecto.Changeset

  alias Flirtual.User.Preferences

  @derive {Jason.Encoder, only: [:matches, :messages, :likes, :newsletter]}

  schema "user_preference_email_notifications" do
    belongs_to :preferences, Preferences

    field :matches, :boolean, default: true
    field :messages, :boolean, default: true
    field :likes, :boolean, default: true
    field :newsletter, :boolean, default: true
  end

  def update_changeset(%Preferences.EmailNotifications{} = email_notifications, attrs) do
    email_notifications
    |> cast(attrs, [
      :matches,
      :messages,
      :likes,
      :newsletter,
    ])
  end
end

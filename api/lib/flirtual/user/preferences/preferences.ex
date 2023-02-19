defmodule Flirtual.User.Preferences do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.User.Preferences.Policy

  import Ecto.Changeset

  alias Flirtual.User
  alias Flirtual.User.Preferences
  alias Flirtual.User.Preferences.{EmailNotifications, Privacy}

  @derive {Jason.Encoder, only: [:nsfw, :email_notifications, :privacy]}

  schema "user_preferences" do
    belongs_to :user, User

    field :nsfw, :boolean

    has_one :email_notifications, EmailNotifications
    has_one :privacy, Privacy
  end

  def default_assoc do
    [
      :email_notifications,
      :privacy
    ]
  end

  def update_changeset(%Preferences{} = preferences, attrs) do
    preferences
    |> cast(attrs, [
      :nsfw,
    ])
  end
end

defimpl Jason.Encoder, for: Flirtual.User.Preferences do
  def encode(value, opts) do
    Jason.Encode.map(
      Map.take(value, [:nsfw, :email_notifications, :privacy])
      |> Map.filter(fn {_, value} -> value !== nil end),
      opts
    )
  end
end

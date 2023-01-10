defmodule Flirtual.User.Policy do
  use Flirtual.Policy, reference_key: :user

  alias Flirtual.User

  def authorize(:read, _, _), do: true

  def authorize(:update, %Plug.Conn{assigns: %{session: %{user_id: user_id}}}, %User{
        id: user_id
      }),
      do: true

  def authorize(_, _, _), do: false

  def transform(:email, %Plug.Conn{assigns: %{session: %{user_id: user_id}}}, %User{
        id: user_id,
        email: email
      }),
      do: email

  def transform(:email, _, _), do: nil

  def transform(
        :language,
        %Plug.Conn{assigns: %{session: %{user_id: user_id}}},
        %User{id: user_id} = user
      ),
      do: user.language

  def transform(:language, _, _), do: nil

  def transform(
        :tags,
        %Plug.Conn{assigns: %{session: %{user_id: user_id}}},
        %User{id: user_id} = user
      ),
      do: user.tags

  def transform(:tags, _, _), do: []

  def transform(
        :connections,
        %Plug.Conn{assigns: %{session: %{user_id: user_id}}},
        %User{id: user_id, connections: connections}
      ),
      do: connections

  def transform(:connections, _, %User{
        preferences: %User.Preferences{privacy: %User.Preferences.Privacy{connections: :everyone}},
        connections: connections
      }),
      do: connections

  def transform(:connections, _, _), do: []

  def transform(
        :preferences,
        %Plug.Conn{assigns: %{session: %{user_id: user_id}}},
        %User{id: user_id} = user
      ),
      do: user.preferences

  def transform(:preferences, _, _), do: nil

  def transform(
        :born_at,
        %Plug.Conn{assigns: %{session: %{user_id: user_id}}},
        %User{id: user_id} = user
      ),
      do: user.born_at

  # by default, truncate born at to year,
  # to hide user's exact birthday.
  def transform(:born_at, _, %User{} = user) do
    now = Date.utc_today()

    NaiveDateTime.new!(user.born_at.year, now.month, now.day, 0, 0, 0, 0)
    |> NaiveDateTime.truncate(:second)
  end

  def transform(
        :deactivated_at,
        %Plug.Conn{assigns: %{session: %{user_id: user_id}}},
        %User{id: user_id} = user
      ),
      do: user.deactivated_at

  def transform(:deactivated_at, _, _), do: nil

  def transform(
        :updated_at,
        %Plug.Conn{assigns: %{session: %{user_id: user_id}}},
        %User{id: user_id} = user
      ),
      do: user.updated_at

  def transform(:updated_at, _, _), do: nil

  def transform(
        :created_at,
        %Plug.Conn{assigns: %{session: %{user_id: user_id}}},
        %User{id: user_id} = user
      ),
      do: user.created_at

  def transform(:created_at, _, _), do: nil
end

defmodule Flirtual.User.Policy do
  use Flirtual.Policy, children: [:profile]

  alias Flirtual.User

  def authorize(:read, _, _), do: true
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

  def transform(:preferences, _, _), do: []

  def transform(key, conn, %User{} = user) do
    if key in [:profile] do
      value = Map.get(user, key) |> Map.replace(:user, user)
      conn |> Flirtual.Policy.transform(value)
    else
      Map.get(user, key, nil)
    end
  end
end

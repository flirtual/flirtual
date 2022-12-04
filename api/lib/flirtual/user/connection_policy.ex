defmodule Flirtual.User.Connection.Policy do
  use Flirtual.Policy

  alias Flirtual.User
  alias Flirtual.User.Connection

  def authorize(:read, _, %Connection{
    user: %User{
      preferences: %User.Preferences{
        privacy: %User.Preferences.Privacy{
          connections: :everyone
        }
      }
    }
  }) do
    true
  end

  def authorize(_, _, _), do: false
end

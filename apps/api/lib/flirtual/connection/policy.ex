defmodule Flirtual.Connection.Policy do
  use Flirtual.Policy

  alias Flirtual.Connection
  alias Flirtual.User

  # The currently logged in user can view their own connections.
  def authorize(
        :read,
        %Plug.Conn{
          assigns: %{
            session: %{
              user_id: user_id
            }
          }
        },
        %Connection{
          user_id: user_id
        }
      ),
      do: true

  # Matches can view other user's Discord connections only.
  def authorize(:read, _, %Connection{
        type: :discord,
        user: %User{
          relationship: %User.Relationship{
            matched: true
          }
        }
      }) do
    true
  end

  # Moderators can view Discord connections only.
  def authorize(
        :read,
        %Plug.Conn{
          assigns: %{
            session: session
          }
        },
        %Connection{type: :discord}
      ),
      do: :moderator in session.user.tags

  # Any other action, or credentials are disallowed.
  def authorize(_, _, _), do: false

  def transform(:avatar_url, _, %Connection{} = connection),
    do: Connection.provider!(connection.type).profile_avatar_url(connection)

  def transform(:url, _, %Connection{} = connection),
    do: Connection.provider!(connection.type).profile_url(connection)
end

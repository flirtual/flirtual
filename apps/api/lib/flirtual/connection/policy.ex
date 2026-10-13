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

  # Matches can view other users' visible connections; moderators can view all of them.
  def authorize(:read, conn, %Connection{
        type: type,
        user: %User{
          relationship: %User.Relationship{
            matched: true
          }
        }
      }),
      do: Connection.visible?(type) or moderator?(conn)

  def authorize(:read, conn, %Connection{}), do: moderator?(conn)

  # Any other action, or credentials are disallowed.
  def authorize(_, _, _), do: false

  defp moderator?(%Plug.Conn{assigns: %{session: session}}), do: :moderator in session.user.tags
  defp moderator?(_), do: false

  def transform(:avatar_url, _, %Connection{} = connection),
    do: Connection.provider!(connection.type).profile_avatar_url(connection)

  def transform(:url, _, %Connection{} = connection),
    do: Connection.provider!(connection.type).profile_url(connection)
end

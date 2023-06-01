defmodule Flirtual.User.Preferences.Policy do
  use Flirtual.Policy, reference_key: :user

  alias Flirtual.User.Preferences

  # The current session can read their own preferences.
  def authorize(
        :read,
        %Plug.Conn{
          assigns: %{
            session: %{
              user_id: user_id
            }
          }
        },
        %Preferences{
          user_id: user_id
        }
      ),
      do: true

  # Any other action, or credentials are disallowed.
  def authorize(_, _, _), do: false
end

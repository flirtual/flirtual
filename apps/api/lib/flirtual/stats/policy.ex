defmodule Flirtual.Stats.Policy do
  use Flirtual.Policy

  alias Flirtual.User

  @admin_actions [
    :read
  ]

  def authorize(
        action,
        %Plug.Conn{
          assigns: %{
            session: %{
              user: %User{} = user
            }
          }
        },
        _
      )
      when action in @admin_actions,
      do: :admin in user.tags

  # Any other action, or credentials are disallowed.
  def authorize(_, _, _), do: false
end

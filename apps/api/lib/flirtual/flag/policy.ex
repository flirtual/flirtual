defmodule Flirtual.Flag.Policy do
  use Flirtual.Policy

  alias Flirtual.Flag
  alias Flirtual.User

  @moderator_actions [
    :search,
    :create,
    :delete
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
      when action in @moderator_actions,
      do: :moderator in user.tags

  # Any other action, or credentials are disallowed.
  def authorize(_, _, _), do: false

  def transform(_, %Flag{} = flag), do: flag
end

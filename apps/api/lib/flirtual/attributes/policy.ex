defmodule Flirtual.Attribute.Policy do
  use Flirtual.Policy

  alias Flirtual.Attribute
  alias Flirtual.User

  @admin_actions [
    :index,
    :create,
    :update,
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
      when action in @admin_actions,
      do: :admin in user.tags

  # Any other action, or credentials are disallowed.
  def authorize(_, _, _), do: false

  def transform(_, %Attribute{} = attribute), do: attribute
end

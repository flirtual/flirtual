defmodule Flirtual.Report.Policy do
  use Flirtual.Policy

  alias Flirtual.Report

  # User can read their own reports against other users.
  def authorize(
        :read,
        %Plug.Conn{
          assigns: %{
            session: %{
              user_id: user_id
            }
          }
        },
        %Report{
          user_id: user_id
        }
      ),
      do: true

  # Users cannot interact with reports against them, inclusive of moderators.
  def authorize(
        _,
        %Plug.Conn{
          assigns: %{
            session: %{
              user_id: user_id
            }
          }
        },
        %Report{
          target_id: user_id
        }
      ),
      do: false

  # Moderators can read all reports.
  def authorize(
        :read,
        %Plug.Conn{
          assigns: %{
            session: %{
              user: user
            }
          }
        },
        _
      ),
      do: :moderator in user.tags

  # By default, users cannot do anything.
  def authorize(_, _, _), do: false
end

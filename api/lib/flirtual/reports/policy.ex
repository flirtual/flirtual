defmodule Flirtual.Report.Policy do
  use Flirtual.Policy,
    only: [
      :id,
      :reason,
      :message,
      :reviewed_at,
      :user_id,
      :target_id,
      :updated_at,
      :created_at
    ]

  alias Flirtual.Report

  # Users cannot interact with reports against them, regardless of any role.
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

  # Moderators can read/delete all reports.
  def authorize(
        type,
        %Plug.Conn{
          assigns: %{
            session: %{
              user: user
            }
          }
        },
        _
      )
      when type in [:read, :delete] do
    :moderator in user.tags
  end

  # By default, users cannot do anything.
  def authorize(_, _, _), do: false
end

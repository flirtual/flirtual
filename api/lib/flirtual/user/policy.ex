defmodule Flirtual.User.Policy do
  use Flirtual.Policy, reference_key: :user

  import Flirtual.Utilities

  alias Flirtual.Policy
  alias Flirtual.User
  alias Flirtual.User.Session

  def authorize(
        _,
        %Plug.Conn{
          assigns: %{
            session: %{
              user: %User{
                banned_at: banned_at
              }
            }
          }
        },
        _
      )
      when not is_nil(banned_at),
      do: false

  @own_actions [
    :read,
    :update
  ]

  def authorize(
        action,
        %Plug.Conn{
          assigns: %{
            session: %{
              user_id: user_id
            }
          }
        },
        %User{
          id: user_id
        }
      )
      when action in @own_actions,
      do: true

  @moderator_actions [
    :suspend
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

  def authorize(
        :read,
        %Plug.Conn{
          assigns: %{
            session: %Session{} = session
          }
        },
        %User{} = user
      ) do
    if User.visible?(user) do
      true
    else
      :moderator in session.user.tags
    end
  end

  @admin_actions [
    :sudo
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

  @debugger_actions [
    :arbitrary_code_execution,
    :read_error_cipher
  ]

  def authorize(
        action,
        %Plug.Conn{
          assigns: %{
            session: %{
              user: %User{
                tags: tags
              }
            }
          }
        },
        _
      )
      when action in @debugger_actions,
      do: :debugger in tags

  # Any other action, or credentials are disallowed.
  def authorize(_, _, _), do: false

  @own_property_keys [
    :email,
    :language,
    :talkjs_signature,
    :active_at,
    :tags,
    :connections,
    :born_at,
    :email_confirmed_at,
    :deactivated_at,
    :updated_at,
    :created_at,
    :matched,
    :relation,
    :blocked
  ]

  def transform(
        key,
        %Plug.Conn{
          assigns: %{
            session: %{
              user_id: user_id
            }
          }
        },
        %User{
          id: user_id
        } = user
      )
      when key in @own_property_keys,
      do: user[key]

  @moderator_property_keys [
    :shadowbanned_at,
    :email_confirmed_at
  ]

  def transform(
        key,
        %Plug.Conn{
          assigns: %{
            session: session
          }
        },
        %User{} = user
      )
      when key in @moderator_property_keys do
    if :moderator in session.user.tags, do: user[key], else: nil
  end

  def transform(
        :active_at,
        _,
        %User{} = user
      ) do
    user.active_at
    |> DateTime.to_date()
    |> DateTime.new!(Time.new!(0, 0, 0))
  end

  def transform(
        :connections,
        _,
        %User{
          preferences: %User.Preferences{
            privacy: %User.Preferences.Privacy{
              connections: :everyone
            }
          }
        } = user
      ),
      do: user.connections

  @day_in_seconds 86400

  # Truncate born at to year, to hide user's exact birthday.
  def transform(:born_at, _, %User{born_at: born_at} = user) when not is_nil(born_at) do
    now = Date.utc_today()

    DateTime.new!(
      Date.new!(now.year - get_years_since(user.born_at), now.month, now.day),
      Time.new!(0, 0, 0, 0)
    )
    |> DateTime.add(-@day_in_seconds)
    |> DateTime.truncate(:second)
  end

  def transform(:visible, _, user), do: User.visible?(user)

  def transform(
        :relation,
        %Plug.Conn{
          assigns: %{
            session: session
          }
        },
        user
      ),
      do: User.relation(session.user, user)

  def transform(
        :matched,
        %Plug.Conn{
          assigns: %{
            session: session
          }
        },
        user
      ),
      do: User.matched?(session.user, user)

  def transform(
        :blocked,
        %Plug.Conn{
          assigns: %{
            session: session
          }
        },
        user
      ),
      do: User.blocked?(session.user, user)

  def transform(key, _, _) when key in @own_property_keys, do: nil
  def transform(key, _, _) when key in @moderator_property_keys, do: nil

  def transform(:preferences, conn, user) do
    if(Policy.can?(conn, :read, user.preferences), do: user.preferences, else: nil)
  end
end

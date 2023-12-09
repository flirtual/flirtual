defmodule Flirtual.User.Policy do
  use Flirtual.Policy, reference_key: :user

  import Flirtual.Utilities

  alias Flirtual.Policy
  alias Flirtual.User
  alias Flirtual.User.Session

  defp truncate_date(date) do
    now = Date.utc_today()

    Date.new!(now.year - get_years_since(date), now.month, now.day)
    |> Date.add(-1)
  end

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
    :inspect,
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
    :suspend,
    :warn,
    :note,
    :search
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
    :sudo,
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

  @debugger_actions [
    :read_error_cipher,
    :inspect
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

  def transform(
        %Plug.Conn{
          assigns: %{
            user: user
          }
        },
        target
      ) do
    target
    |> User.with_relationship(user)
  end

  def transform(
        :connections,
        _,
        %User{
          relationship: %User.Relationship{
            matched: true
          }
        } = user
      ),
      do: user[:connections]

  @own_property_keys [
    :email,
    :language,
    :talkjs_signature,
    :apns_token,
    :fcm_token,
    :push_count,
    :rating_prompts,
    :revenuecat_id,
    :moderator_message,
    :active_at,
    :connections,
    :passkeys,
    :born_at,
    :email_confirmed_at,
    :deactivated_at,
    :updated_at,
    :created_at
  ]

  def transform(
        :relationship,
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
      ),
      do: nil

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
    :moderator_message,
    :moderator_note,
    :shadowbanned_at,
    :banned_at,
    :deactivated_at,
    :email_confirmed_at,
    :created_at,
    :connections
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
        %Plug.Conn{
          assigns: %{
            session: session
          }
        },
        %User{} = user
      ) do
    if :moderator in session.user.tags,
      do: user.active_at,
      else:
        user.active_at
        |> DateTime.to_date()
        |> DateTime.new!(Time.new!(0, 0, 0))
  end

  # Truncate born at to year, to hide user's exact birthday.
  def transform(
        :born_at,
        %Plug.Conn{
          assigns: %{
            session: session
          }
        },
        %User{born_at: born_at}
      )
      when not is_nil(born_at) do
    if :admin in session.user.tags,
      do: born_at,
      else: truncate_date(born_at)
  end

  def transform(
        :talkjs_id,
        _,
        %User{id: user_id}
      ),
      do: ShortUUID.decode!(user_id)

  @admin_property_keys [
    :email,
    :born_at,
    :stripe_id,
    :revenuecat_id
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
      when key in @admin_property_keys do
    if :admin in session.user.tags, do: user[key], else: nil
  end

  def transform(key, _, _) when key in @own_property_keys, do: nil
  def transform(key, _, _) when key in @moderator_property_keys, do: nil

  # HACK: This value is potentially out of sync, so we ignore the value from the database,
  # and compute the users' visibility based on their current state.
  def transform(:visible, _, %User{} = user), do: User.visible?(user)

  def transform(:preferences, conn, user) do
    if(Policy.can?(conn, :read, user.preferences), do: user.preferences, else: nil)
  end
end

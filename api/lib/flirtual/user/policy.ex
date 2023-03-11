defmodule Flirtual.User.Policy do
  use Flirtual.Policy, reference_key: :user

  alias Flirtual.Policy
  alias Flirtual.User

  # Any user can read any other users.
  def authorize(:read, _, _), do: true

  # The currently logged in user can update their own user.
  def authorize(
        :update,
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
      do: true

  def authorize(
        :sudo,
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
      ),
      do: :admin in tags

  # Any other action, or credentials are disallowed.
  def authorize(_, _, _), do: false

  # The currently logged in user can view their own email.
  def transform(
        :email,
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
      ),
      do: user.email

  # Otherwise, by default, nobody can view this user's email.
  def transform(:email, _, _), do: nil

  # The currently logged in user can view their own language.
  def transform(
        :language,
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
      ),
      do: user.language

  # Otherwise, by default, nobody can view this user's language.
  def transform(:language, _, _), do: nil

  # The currently logged in user can view their own talkjs signature.
  def transform(
        :talkjs_signature,
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
      ),
      do: user.talkjs_signature

  # Otherwise, by default, nobody can view this user's talkjs signature.
  def transform(:talkjs_signature, _, _), do: nil

  def transform(
        :active_at,
        _,
        %User{} = user
      ) do
    if is_nil(user.active_at) do
      nil
    else
      Date.new!(user.active_at.year, user.active_at.month, user.active_at.day + 9)
    end
  end

  def transform(:active_at, _, _), do: nil

  def transform(:visible, _, user), do: User.visible?(user)

  # The currently logged in user can view their own tags.
  def transform(
        :tags,
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
      ),
      do: user.tags

  # Otherwise, by default, nobody can view this user's tags.
  def transform(:tags, _, _), do: []

  # The currently logged in user can view their own connections.
  def transform(
        :connections,
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
      ),
      do: user.connections

  # Any user can view this user's connections if
  # their connections privacy setting is set to everyone.
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

  # Otherwise, by default, nobody can view this user's connections.
  def transform(:connections, _, _), do: []

  def transform(:preferences, conn, user) do
    if(Policy.can?(conn, :read, user.preferences), do: user.preferences, else: nil)
  end

  # The currently logged user can see their own birthday.
  def transform(
        :born_at,
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
      ),
      do: user.born_at

  # By default, truncate born at to year, to hide user's exact birthday.
  def transform(:born_at, _, %User{} = user) do
    if user.born_at do
      now = Date.utc_today()

      # Note: this doesn't work at all, and I was high when I wrote this.
      NaiveDateTime.new!(user.born_at.year, now.month, now.day, 0, 0, 0, 0)
      |> NaiveDateTime.truncate(:second)
    else
      nil
    end
  end

  # The currently logged user can see when their own account was deactivated.
  def transform(
        :deactivated_at,
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
      ),
      do: user.deactivated_at

  # Otherwise, by default, nobody can view when this user was deactivated.
  def transform(:deactivated_at, _, _), do: nil

  # The currently logged user can see when their own account was updated.
  def transform(
        :updated_at,
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
      ),
      do: user.updated_at

  # Otherwise, by default, nobody can view when this user was updated.
  def transform(:updated_at, _, _), do: nil

  # The currently logged user can see when their own user was created.
  def transform(
        :created_at,
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
      ),
      do: user.created_at

  # Otherwise, by default, nobody can view when this user was created.
  def transform(:created_at, _, _), do: nil
end

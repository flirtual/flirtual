defmodule Flirtual.User.Policy do
  use Flirtual.Policy, reference_key: :user

  import Flirtual.Utilities

  alias Flirtual.Policy
  alias Flirtual.Talkjs
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
    :indef_shadowban,
    :unindef_shadowban,
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
        %User{} = target
      ),
      do: can_read?(session.user, target)

  def can_read?(%User{} = user, %User{} = target) do
    cond do
      :moderator in user.tags -> true
      target.status != :visible -> false
      User.blocked?(target, user) -> false
      true -> true
    end
  end

  @admin_actions [
    :unsuspend,
    :payments_ban,
    :payments_unban,
    :update_tags,
    :manage_subscription,
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

  # def transform(
  #       %Plug.Conn{
  #         assigns: %{
  #           user: user
  #         }
  #       },
  #       target
  #     ) do
  #   target
  #   |> User.with_relationship(user)
  # end

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
    :apns_tokens,
    :fcm_tokens,
    :platforms,
    :push_count,
    :rating_prompts,
    :news,
    :entitlements,
    :revenuecat_id,
    :moderator_message,
    :active_at,
    :connections,
    :passkeys,
    :born_at,
    :email_confirmed_at,
    :tns_discord_in_biography,
    :deactivated_at,
    :updated_at,
    :created_at
  ]

  # def transform(
  #       :relationship,
  #       %Plug.Conn{
  #         assigns: %{
  #           session: %{
  #             user_id: user_id
  #           }
  #         }
  #       },
  #       %User{
  #         id: user_id
  #       }
  #     ),
  #     do: nil

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
    :email,
    :moderator_message,
    :moderator_note,
    :shadowbanned_at,
    :indef_shadowbanned_at,
    :payments_banned_at,
    :banned_at,
    :deactivated_at,
    :email_confirmed_at,
    :created_at,
    :connections,
    :entitlements,
    :tns_discord_in_biography
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

  # Return computed age for all users.
  def transform(
        :age,
        _,
        %User{born_at: born_at}
      )
      when not is_nil(born_at) do
    get_years_since(born_at)
  end

  # Only return exact born_at to self and moderators.
  def transform(
        :born_at,
        %Plug.Conn{
          assigns: %{
            session: session
          }
        },
        %User{born_at: born_at} = user
      )
      when not is_nil(born_at) do
    if session.user.id == user.id or :moderator in session.user.tags,
      do: born_at,
      else: nil
  end

  def transform(
        :talkjs_id,
        _,
        %User{id: user_id}
      ),
      do: ShortUUID.decode!(user_id)

  def transform(
        :talkjs_token,
        %Plug.Conn{
          assigns: %{
            session: %{
              user_id: user_id
            }
          }
        },
        %User{id: user_id}
      ),
      do: Talkjs.new_user_token(user_id)

  def transform(:talkjs_token, _, _), do: nil

  def transform(
        :has_password,
        %Plug.Conn{assigns: %{session: %{user_id: user_id}}},
        %User{id: user_id} = user
      ),
      do: User.has_password?(user)

  def transform(:has_password, _, _), do: nil

  @admin_property_keys [
    :email,
    :born_at,
    :chargebee_id,
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

  def transform(:visible, _, %User{} = user), do: user.status == :visible

  def transform(:preferences, conn, user) do
    if(Policy.can?(conn, :read, user.preferences), do: user.preferences, else: nil)
  end
end

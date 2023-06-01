defmodule Flirtual.User.Profile.LikesAndPasses.Policy do
  use Flirtual.Policy

  alias Flirtual.Policy
  alias Flirtual.User
  alias Flirtual.Subscription
  alias Flirtual.User.Profile.LikesAndPasses

  @own_actions [
    :read,
    :delete
  ]

  def authorize(
        :count,
        %Plug.Conn{
          assigns: %{
            session: %{
              user: %User{
                id: user_id
              }
            }
          }
        },
        %LikesAndPasses{
          target_id: user_id,
          type: :like
        }
      ),
      do: true

  def authorize(
        :read,
        %Plug.Conn{
          assigns: %{
            session: %{
              user: %User{
                id: user_id,
                subscription: %Subscription{
                  cancelled_at: nil
                }
              }
            }
          }
        },
        %LikesAndPasses{
          target_id: user_id,
          type: :like
        }
      ),
      do: true

  def authorize(
        key,
        %Plug.Conn{
          assigns: %{
            session: %{
              user_id: user_id
            }
          }
        },
        %LikesAndPasses{
          profile_id: user_id
        }
      )
      when key in @own_actions,
      do: true

  def authorize(_, _, _), do: false

  def transform(
        :profile_id,
        %Plug.Conn{
          assigns: %{
            session: %{
              user_id: user_id
            }
          }
        },
        %LikesAndPasses{
          profile_id: user_id
        }
      ),
      do: nil

  @own_property_keys [
    :created_at
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
        %LikesAndPasses{
          profile_id: user_id
        } = item
      )
      when key in @own_property_keys do
    item[key]
  end

  def transform(
        :match,
        %Plug.Conn{
          assigns: %{
            session: %{
              user_id: user_id
            }
          }
        },
        %LikesAndPasses{
          profile_id: user_id,
          type: :like,
          opposite: %LikesAndPasses{
            type: :like
          }
        }
      ),
      do: true

  def transform(:match, _, _), do: nil

  def transform(
        :opposite,
        conn,
        %LikesAndPasses{
          opposite: opposite
        }
      ) do
    if Policy.cannot?(conn, :read, opposite) do
      nil
    else
      Policy.transform(conn, opposite |> Map.delete(:opposite))
    end
  end

  def transform(key, _, _) when key in @own_property_keys, do: nil
end

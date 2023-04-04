defmodule Flirtual.User.Profile.Image.Policy do
  use Flirtual.Policy

  alias Flirtual.User.Session
  alias Flirtual.User.Profile.Image

  def authorize(:read, _, _), do: true
  def authorize(:view, _, _), do: true

  @own_actions [
    :create,
    :update,
    :delete
  ]

  def authorize(
        key,
        %Plug.Conn{
          assigns: %{
            session: %{
              user_id: user_id
            }
          }
        },
        %Image{
          profile_id: user_id
        }
      )
      when key in @own_actions,
      do: true

  @moderator_actions [
    :delete
  ]

  def authorize(
        action,
        %Plug.Conn{
          assigns: %{
            session: %Session{
              user: user
            }
          }
        },
        _
      )
      when action in @moderator_actions,
      do: :moderator in user.tags

  # Any other action, or credentials are disallowed.
  def authorize(_, _, _), do: false

  def transform(:url, _, %Image{} = image),
    do: Image.url(image)

  @own_property_keys [
    :created_at,
    :updated_at
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
        %Image{
          profile_id: user_id
        } = image
      )
      when key in @own_property_keys,
      do: image[key]

  @moderator_property_keys [
    :scanned,
    :created_at,
    :updated_at
  ]

  def transform(
        key,
        %Plug.Conn{
          assigns: %{
            session: %Session{
              user: user
            }
          }
        },
        %Image{} = image
      )
      when key in @moderator_property_keys do
    if :moderator in user.tags, do: image[key], else: nil
  end

  def transform(key, _, _) when key in @own_property_keys, do: nil
  def transform(key, _, _) when key in @moderator_property_keys, do: nil
end

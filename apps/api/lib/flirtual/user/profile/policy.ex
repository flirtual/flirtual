defmodule Flirtual.User.Profile.Policy do
  use Flirtual.Policy, reference_key: :profile

  import Flirtual.Utilities

  alias Flirtual.User
  alias Flirtual.User.Profile
  alias Flirtual.Subscription

  # Any user can read any other user's profile.
  def authorize(:read, _, _), do: true

  @own_actions [
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
        %Profile{
          user_id: user_id
        }
      )
      when action in @own_actions,
      do: true

  def authorize(
        :update_colors,
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
        %Profile{
          user_id: user_id
        }
      ),
      do: true

  # Any other action, or credentials are disallowed.
  def authorize(_, _, _), do: false

  @personality_keys [:openness, :conscientiousness, :agreeableness]
  @connection_keys [:vrchat, :discord]

  @own_property_keys [
                       :country,
                       :preferences,
                       :custom_weights,
                       :queue_love_reset_at,
                       :queue_friend_reset_at,
                       :updated_at
                     ] ++ @personality_keys ++ @connection_keys

  def transform(
        key,
        %Plug.Conn{
          assigns: %{
            session: %{
              user_id: user_id
            }
          }
        },
        %Profile{
          user_id: user_id
        } = profile
      )
      when key in @own_property_keys,
      do: profile[key]

  # Any user can view this profile's country if their
  # country privacy setting is set to everyone.
  def transform(
        :country,
        _,
        %Profile{
          user: %User{
            preferences: %User.Preferences{
              privacy: %User.Preferences.Privacy{
                country: :everyone
              }
            }
          }
        } = profile
      ),
      do: profile.country

  def transform(
        :country,
        _,
        %Profile{
          user: %User{
            relationship: %User.Relationship{
              matched: true
            },
            preferences: %User.Preferences{
              privacy: %User.Preferences.Privacy{
                country: :matches
              }
            }
          }
        } = profile
      ),
      do: profile.country

  def transform(
        key,
        _,
        %Profile{
          user: %User{
            preferences: %User.Preferences{
              privacy: %User.Preferences.Privacy{
                connections: :everyone
              }
            }
          }
        } = profile
      )
      when key in @connection_keys,
      do: profile[key]

  def transform(
        key,
        _,
        %Profile{
          user: %User{
            relationship: %User.Relationship{
              matched: true
            },
            preferences: %User.Preferences{
              privacy: %User.Preferences.Privacy{
                connections: :matches
              }
            }
          }
        } = profile
      )
      when key in @connection_keys,
      do: profile[key]

  def transform(
        key,
        %Plug.Conn{
          assigns: %{
            session: session
          }
        },
        profile
      )
      when key in @connection_keys do
    if :moderator in session.user.tags, do: profile[key], else: nil
  end

  # Any user can view this profile's personality trait
  # if their personality privacy setting is set to everyone.
  def transform(
        key,
        _,
        %Profile{
          user: %User{
            preferences: %User.Preferences{
              privacy: %User.Preferences.Privacy{
                personality: :everyone
              }
            }
          }
        } = profile
      )
      when key in @personality_keys do
    Profile.fuzz_personality_key(profile, key)
  end

  def transform(
        key,
        _,
        %Profile{
          user: %User{
            relationship: %User.Relationship{
              matched: true
            },
            preferences: %User.Preferences{
              privacy: %User.Preferences.Privacy{
                personality: :matches
              }
            }
          }
        } = profile
      )
      when key in @personality_keys do
    Profile.fuzz_personality_key(profile, key)
  end

  def transform(
        :attributes,
        %Plug.Conn{
          assigns: %{
            session: %{
              user: %User{} = me
            }
          }
        },
        %Profile{
          user: %User{
            preferences: %User.Preferences{} = preferences
          }
        } = profile
      ) do
    profile.attributes
    |> then(&if(!me.preferences.nsfw, do: exclude_by(&1, :type, "kink"), else: &1))
    |> then(
      &if(me.id !== profile.user_id,
        do:
          Enum.filter(&1, fn attribute ->
            case(attribute.type) do
              "kink" -> preferences.privacy.kinks === :everyone
              "sexuality" -> preferences.privacy.sexuality === :everyone
              _ -> true
            end
          end),
        else: &1
      )
    )
    |> Enum.map(&%{id: &1.id, type: &1.type})
  end

  @nsfw_property_keys [
    :domsub
  ]

  def transform(
        key,
        %Plug.Conn{
          assigns: %{
            session: %{
              user: %User{
                preferences: %User.Preferences{
                  nsfw: true,
                  privacy: %User.Preferences.Privacy{
                    kinks: :everyone
                  }
                }
              }
            }
          }
        },
        %Profile{} = profile
      )
      when key in @nsfw_property_keys,
      do: profile[key]

  def transform(
        key,
        %Plug.Conn{
          assigns: %{
            session: %{
              user: %User{
                relationship: %User.Relationship{
                  matched: true
                },
                preferences: %User.Preferences{
                  nsfw: true,
                  privacy: %User.Preferences.Privacy{
                    kinks: :matches
                  }
                }
              }
            }
          }
        },
        %Profile{} = profile
      )
      when key in @nsfw_property_keys,
      do: profile[key]

  def transform(
        key,
        %Plug.Conn{
          assigns: %{
            session: %{
              user: %User{
                preferences: %User.Preferences{
                  nsfw: true
                }
              }
            }
          }
        },
        profile
      )
      when key in @nsfw_property_keys,
      do: profile[key]

  @admin_property_keys [
    :preferences
  ]

  def transform(
        key,
        %Plug.Conn{
          assigns: %{
            session: session
          }
        },
        %Profile{} = profile
      )
      when key in @admin_property_keys do
    if :admin in session.user.tags, do: profile[key], else: nil
  end

  def transform(key, _, _) when key in @nsfw_property_keys, do: nil

  def transform(key, _, _) when key in @own_property_keys, do: nil
end

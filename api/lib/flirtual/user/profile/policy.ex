defmodule Flirtual.User.Profile.Policy do
  use Flirtual.Policy, reference_key: :profile

  import Flirtual.Utilities

  alias Flirtual.User
  alias Flirtual.User.Profile

  # Any user can read any other user's profile.
  def authorize(:read, _, _), do: true

  # The currently logged in user can update their own profile.
  def authorize(
        :update,
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
      ),
      do: true

  # Any other action, or credentials are disallowed.
  def authorize(_, _, _), do: false

  # The current session can view their own country.
  def transform(
        :country,
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
      ),
      do: profile.country

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

  # Otherwise, by default, nobody can view this profile's country.
  def transform(:country, _, _), do: nil

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
    |> then(&if(not me.preferences.nsfw, do: exclude_by(&1, :type, "kink"), else: &1))
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

  def transform(
        :domsub,
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
        %Profile{} = profile
      ),
      do: profile.domsub

  def transform(:domsub, _, _), do: nil

  # The current session can view their own personality openness trait.
  def transform(
        :openness,
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
      ),
      do: profile.openness

  # Any user can view this profile's personality openness trait
  # if their personality privacy setting is set to everyone.
  def transform(
        :openness,
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
      ) do
    # Fuzz openness to prevent inferring original personality question answers.
    if(profile.openness > 0, do: 1, else: -1)
  end

  # Otherwise, by default, nobody can view this profile's personality openness trait.
  def transform(:openness, _, _), do: nil

  # The current session can view their own personality conscientiousness trait.
  def transform(
        :conscientiousness,
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
      ),
      do: profile.conscientiousness

  # Any user can view this profile's personality conscientiousness trait
  # if their personality privacy setting is set to everyone.
  def transform(
        :conscientiousness,
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
      ) do
    # Fuzz conscientiousness to prevent inferring original personality question answers.
    if(profile.conscientiousness > 0, do: 1, else: -1)
  end

  # Otherwise, by default, nobody can view this profile's personality conscientiousness trait.
  def transform(:conscientiousness, _, _), do: nil

  # The current session can view their own personality agreeableness trait.
  def transform(
        :agreeableness,
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
      ),
      do: profile.agreeableness

  # Any user can view this profile's personality agreeableness trait
  # if their personality privacy setting is set to everyone.
  def transform(
        :agreeableness,
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
      ) do
    # Fuzz agreeableness to prevent inferring original personality question answers.
    if(profile.agreeableness > 0, do: 1, else: -1)
  end

  # Otherwise, by default, nobody can view this profile's personality agreeableness trait.
  def transform(:agreeableness, _, _), do: nil

  # The current session can view their own profile's preferences.
  def transform(
        :preferences,
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
      ),
      do: profile.preferences

  # Otherwise, by default, nobody can view this profile's preferences.
  def transform(:preferences, _, _), do: nil

  # The current session can view their own profile's custom weights.
  def transform(
        :custom_weights,
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
      ),
      do: profile.custom_weights

  # Otherwise, by default, nobody can view this profile's custom weights.
  def transform(:custom_weights, _, _), do: nil
end
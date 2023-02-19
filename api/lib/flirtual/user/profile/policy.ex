defmodule Flirtual.User.Profile.Policy do
  use Flirtual.Policy, reference_key: :profile

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

  def transform(
        :kinks,
        %Plug.Conn{
          assigns: %{
            session: %{
              user: %User{
                preferences: %User.Preferences{
                  nsfw: false
                }
              }
            }
          }
        },
        _
      ),
      do: nil

  def transform(
        :kinks,
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
      do: profile.kinks

  # Any user can view this profile's kinks if their
  # kinks privacy setting is set to everyone.
  def transform(
        :kinks,
        _,
        %Profile{
          user: %User{
            preferences: %User.Preferences{
              privacy: %User.Preferences.Privacy{
                kinks: :everyone
              }
            }
          }
        } = profile
      ),
      do: profile.kinks

  # Otherwise, by default, nobody can view this profile's kinks.
  def transform(:kinks, _, _), do: nil

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

  # The current session can view their own sexuality.
  def transform(
        :sexuality,
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
      do: profile.sexuality

  # Any user can view this profile's sexuality
  # if their sexuality privacy setting is set to everyone.
  def transform(
        :sexuality,
        _,
        %Profile{
          user: %User{
            preferences: %User.Preferences{
              privacy: %User.Preferences.Privacy{
                sexuality: :everyone
              }
            }
          }
        } = profile
      ),
      do: profile.sexuality

  # Otherwise, by default, nobody can view this profile's sexualities.
  def transform(:sexuality, _, _), do: []

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

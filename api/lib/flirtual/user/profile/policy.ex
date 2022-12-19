defmodule Flirtual.User.Profile.Policy do
  use Flirtual.Policy, reference_key: :profile

  alias Flirtual.User
  alias Flirtual.User.Profile

  def authorize(:read, _, _), do: true
  def authorize(_, _, _), do: false

  ## country
  def transform(
        :country,
        %Plug.Conn{assigns: %{session: %{user_id: user_id}}},
        %Profile{user_id: user_id, country: country}
      ),
      do: country

  def transform(:country, _, %Profile{
        user: %User{
          preferences: %User.Preferences{
            privacy: %User.Preferences.Privacy{country: :everyone}
          }
        },
        country: country
      }),
      do: country

  def transform(:country, _, _), do: nil

  # personality (openness, conscientiousness, agreeableness)

  ## openness
  def transform(
        :openness,
        %Plug.Conn{assigns: %{session: %{user_id: user_id}}},
        %Profile{user_id: user_id, openness: openness}
      ),
      do: openness

  def transform(:openness, _, %Profile{
        user: %User{
          preferences: %User.Preferences{
            privacy: %User.Preferences.Privacy{personality: :everyone}
          }
        },
        openness: openness
      }),
      do: if(openness > 0, do: 1, else: -1)

  def transform(:openness, _, _), do: nil

  ## conscientiousness
  def transform(
        :conscientiousness,
        %Plug.Conn{assigns: %{session: %{user_id: user_id}}},
        %Profile{user_id: user_id, conscientiousness: conscientiousness}
      ),
      do: conscientiousness

  def transform(:conscientiousness, _, %Profile{
        user: %User{
          preferences: %User.Preferences{
            privacy: %User.Preferences.Privacy{personality: :everyone}
          }
        },
        conscientiousness: conscientiousness
      }),
      do: conscientiousness

  def transform(:conscientiousness, _, _), do: nil

  ## agreeableness
  def transform(
        :agreeableness,
        %Plug.Conn{assigns: %{session: %{user_id: user_id}}},
        %Profile{user_id: user_id, agreeableness: agreeableness}
      ),
      do: agreeableness

  def transform(:agreeableness, _, %Profile{
        user: %User{
          preferences: %User.Preferences{
            privacy: %User.Preferences.Privacy{personality: :everyone}
          }
        },
        agreeableness: agreeableness
      }),
      do: agreeableness

  def transform(:agreeableness, _, _), do: nil

  ## sexuality
  def transform(
        :sexuality,
        %Plug.Conn{assigns: %{session: %{user_id: user_id}}},
        %Profile{user_id: user_id, sexuality: sexuality}
      ),
      do: sexuality

  def transform(:sexuality, _, %Profile{
        user: %User{
          preferences: %User.Preferences{
            privacy: %User.Preferences.Privacy{sexuality: :everyone}
          }
        },
        sexuality: sexuality
      }),
      do: sexuality

  def transform(:sexuality, _, _), do: []

  ## preferences
  def transform(
        :preferences,
        %Plug.Conn{assigns: %{session: %{user_id: user_id}}},
        %Profile{user_id: user_id, preferences: preferences}
      ),
      do: preferences

  def transform(:preferences, _, _), do: nil

  ## custom_weights
  def transform(
        :custom_weights,
        %Plug.Conn{assigns: %{session: %{user_id: user_id}}},
        %Profile{user_id: user_id, custom_weights: custom_weights}
      ),
      do: custom_weights

  def transform(:custom_weights, _, _), do: nil
end

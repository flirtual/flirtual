defmodule Flirtual.User.Profile.Preferences.Policy do
  use Flirtual.Policy, reference_key: :preferences

  def authorize(_, _, _), do: true
end

defmodule Flirtual.User.Profile.Preferences.Policy do
  use Flirtual.Policy, reference_key: :preferences

  alias Flirtual.Attribute
  alias Flirtual.User.Profile.Preferences

  def authorize(_, _, _), do: true

  def transform(:attributes, _, %Preferences{} = profile), do: Attribute.group(profile.attributes)
end

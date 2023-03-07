defmodule Flirtual.User.Profile.Preferences.Policy do
  use Flirtual.Policy, reference_key: :preferences

  alias Flirtual.User.Profile.Preferences

  def authorize(_, _, _), do: true

  def transform(:attributes, _, %Preferences{} = profile) do
    profile.attributes |> Enum.map(&%{id: &1.id, type: &1.type})
  end
end

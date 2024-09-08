defmodule Flirtual.User.Profile.Preferences.Policy do
  use Flirtual.Policy, reference_key: :preferences

  alias Flirtual.User.Profile.Preferences

  def authorize(_, _, _), do: true

  def transform(:attributes, _, %Preferences{} = profile) do
    profile.attributes
    |> Enum.reduce(%{}, fn %{id: id, type: type}, acc ->
      Map.update(acc, type, [id], fn existing -> [id | existing] end)
    end)
  end
end

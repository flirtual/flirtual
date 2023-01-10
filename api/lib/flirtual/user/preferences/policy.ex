defmodule Flirtual.User.Preferences.Policy do
  use Flirtual.Policy, reference_key: :user

  def authorize(:read, _, _), do: true
  def authorize(_, _, _), do: false
end

defmodule Flirtual.Features do
  def get(key) when is_atom(key), do: Application.fetch_env!(:flirtual, :features)[key]

  def homie_mode?, do: get(:homie_mode?)
  def personality?, do: get(:personality?)
  def vr_tags?, do: get(:vr_tags?)
  def vrchat?, do: get(:vrchat?)

  # Strings: to_existing_atom drops providers whose modules haven't loaded yet.
  def connections, do: get(:connections)

  def connection?(:vrchat), do: vrchat?() and "vrchat" in connections()
  def connection?(type) when is_atom(type), do: to_string(type) in connections()
end

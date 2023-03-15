defmodule FlirtualWeb.Utilities do
  import Flirtual.Utilities

  def split_to_atom_list(value, separator \\ ",")
  def split_to_atom_list(nil, _), do: []
  def split_to_atom_list("", _), do: []

  def split_to_atom_list(value, separator) when is_binary(value) do
    value |> String.split(separator) |> Enum.map(&to_atom(&1))
  end

  def split_to_atom_list(_, _), do: []
end

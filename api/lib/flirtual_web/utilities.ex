defmodule FlirtualWeb.Utilities do
  import Phoenix.LiveView.Helpers

  def tw_class(assigns, classes) do
    tw_class([assigns[:class] | classes])
  end

  def tw_class(classes) do
    classes |> List.flatten() |> Enum.filter(&(not is_nil(&1))) |> Enum.join(" ") |> String.trim()
  end

  def attr_merge(assigns, attributes \\ %{}, excludes \\ []) do
    assigns
    |> Map.drop(excludes)
    |> Map.merge(attributes)
    |> Map.merge(
      if not is_nil(attributes[:class]),
        do: %{class: tw_class([assigns[:class], attributes[:class]])},
        else: %{}
    )
    |> assigns_to_attributes
  end

  def split_to_atom_list(value, separator \\ ",")
  def split_to_atom_list(nil, _), do: []
  def split_to_atom_list("", _), do: []
  def split_to_atom_list(value, separator) when is_binary(value) do
    value |> String.split(separator) |> Enum.map(&Flirtual.Utilities.to_atom(&1))
  end
  def split_to_atom_list(_, _), do: []

end

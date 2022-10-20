defmodule FlirtualWeb.Utilities do
  import Phoenix.LiveView.Helpers

  def tw_class(assigns, classes) do
    tw_class(classes ++ [assigns[:class]])
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
end

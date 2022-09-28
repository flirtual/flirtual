defmodule FlirtualWeb.Utilities do
  def cls(assigns, classes) do
    cls([assigns[:class] | classes])
  end
  def cls(classes) do
    classes |> Enum.join(" ")
  end
end

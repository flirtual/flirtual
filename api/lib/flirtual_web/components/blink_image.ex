defmodule FlirtualWeb.Components.BlinkImage do
  use Phoenix.Component

  def blink_image(assigns) do
    ~H"""
    <lr-img uuid={@src} {assigns |> Map.drop([:src])}/>
    """
  end
end

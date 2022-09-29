defmodule FlirtualWeb.Components.UploadCareImage do
  use Phoenix.Component

  def uc_image(assigns) do
    ~H"""
    <img data-blink-uuid={@src} {assigns |> Map.drop([:src])}/>
    """
  end
end

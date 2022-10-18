defmodule FlirtualWeb.Components.Input.FormAlternativeActionLink do
  use Phoenix.Component

  import FlirtualWeb.Components.Icon

  def alt_action_link(assigns) do
    ~H"""
    <a href={assigns.href} class="flex items-center gap-2 text-lg font-nunito">
      <.icon name="arrow-long-right" type="outline" class="inline w-6"/>
      <%= render_slot(@inner_block) %>
    </a>
    """
  end
end

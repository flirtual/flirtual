defmodule FlirtualWeb.Components.LandingButton do
  use Phoenix.Component

  def button(assigns) do
    ~H"""
    <button class={"rounded-xl p-4 w-48 text-2xl bg-white text-pink-400 #{@kind}"}>
    <%= render_slot(@inner_block) %>
    </button>
    """
  end
end

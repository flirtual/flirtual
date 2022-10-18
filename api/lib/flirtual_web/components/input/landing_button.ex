defmodule FlirtualWeb.Components.Input.LandingButton do
  use Phoenix.Component

  def landing_button(%{kind: "primary"} = assigns) do
    ~H"""
    <a
      {assigns |> Map.drop([:inner_block])}
      class="w-48 p-4 text-2xl text-center text-white cursor-pointer font-montserrat rounded-xl bg-brand-gradient shadow-brand-1"
    >
      <span><%= render_slot(@inner_block) %></span>
    </a>
    """
  end

  def landing_button(%{kind: "secondary"} = assigns) do
    ~H"""
    <a
      {assigns |> Map.drop([:inner_block])}
      class="w-48 p-4 text-2xl text-center bg-white cursor-pointer font-montserrat rounded-xl text-brand-pink shadow-brand-1"
    >
      <span><%= render_slot(@inner_block) %></span>
    </a>
    """
  end

  def landing_button(%{kind: "secondary-cta"} = assigns) do
    ~H"""
    <a
      {assigns |> Map.drop([:inner_block])}
      class="w-64 p-4 text-3xl text-center bg-white cursor-pointer font-montserrat rounded-xl text-brand-pink shadow-brand-1"
    >
      <span><%= render_slot(@inner_block) %></span>
    </a>
    """
  end
end

defmodule FlirtualWeb.LandingView do
  use FlirtualWeb, :view

  import FlirtualWeb.Components.Footer
  import FlirtualWeb.Components.BlinkImage
  import FlirtualWeb.Utilities

  def snap_section(assigns) do
    ~H"""
    <section class={"w-full h-screen snap-always snap-center #{assigns[:class]}"}>
    <%= render_slot(@inner_block) %>
	  </section>
    """
  end

  def snap_image(assigns) do
    ~H"""
    <div class="relative flex w-full h-screen snap-always snap-center">
      <div class="absolute z-10 flex items-center justify-center w-full h-full p-16">
        <span class="font-bold [text-shadow:0_0_16px_#000] text-7xl font-nunito"><%= @label %></span>
      </div>
      <.blink_image src={@src} class="object-cover w-screen h-screen shrink-0 brightness-75"/>
    </div>
    """
  end

  def profile_image_swipe(assigns) do
    ~H"""
    <div class="absolute h-full aspect-[1/1.5] overflow-hidden border-8 border-white rounded-3xl">
    <.blink_image src={@src} class="w-full h-full"/>
    </div>
    """
  end

  def landing_button(%{kind: "primary"} = assigns) do
    ~H"""
    <button class="w-48 p-4 text-2xl text-white font-montserrat rounded-xl bg-gradient-to-br from-brand-coral to-brand-pink">
      <span><%= render_slot(@inner_block) %></span>
    </button>
    """
  end

  def landing_button(%{kind: "secondary"} = assigns) do
    landing_button(
      assigns
      |> Map.drop([:kind])
      |> Map.merge(%{class: "bg-white text-brand-pink #{assigns[:class]}"})
    )
  end

  def landing_button(%{kind: "secondary-cta"} = assigns) do
    landing_button(
      assigns
      |> Map.merge(%{kind: "secondary", class: "text-3xl w-64 #{assigns[:class]}"})
    )
  end

  def landing_button(assigns) do
    ~H"""
    <button class={"w-48 p-4 text-2xl font-montserrat rounded-xl #{assigns[:class]}"}>
      <span><%= render_slot(@inner_block) %></span>
    </button>
    """
  end
end

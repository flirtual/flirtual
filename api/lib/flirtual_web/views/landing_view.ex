defmodule FlirtualWeb.LandingView do
  use FlirtualWeb, :view

  import FlirtualWeb.Components.Footer
  import FlirtualWeb.Components.UploadCareImage
  import FlirtualWeb.Components.Input.LandingButton
  import FlirtualWeb.Components.Icon

  def mobile_button(assigns) do
    ~H"""
    <a href={@href} target="_blank" class="flex items-center w-56 gap-4 px-6 py-4 bg-black rounded-xl">
      <.icon class="h-8" name={@icon}/>
      <div class="flex flex-col justify-center text-left">
        <span class="text-xs uppercase font-montserrat">Download on</span>
        <span class="text- font-nunito"><%= @label %></span>
      </div>
    </a>
    """
  end

  def snap_section(assigns) do
    ~H"""
    <section {assigns |> Map.drop([:inner_block, :class])} class={"w-full h-screen snap-always snap-center #{assigns[:class]}"}>
    <%= render_slot(@inner_block) %>
    </section>
    """
  end

  def snap_image(assigns) do
    ~H"""
    <div class="relative flex w-screen h-screen shrink-0 snap-always snap-center">
      <div class="absolute z-10 flex items-center justify-center w-full h-full p-16">
        <span class="font-bold [text-shadow:0_0_16px_#000] text-7xl font-nunito"><%= @label %></span>
      </div>
      <.uc_image src={@src} class="object-cover w-full h-full shrink-0 brightness-75"/>
    </div>
    """
  end

  def snap_carousel(assigns) do
    content = [
      ["b9326c15-c996-488f-8d68-d7ea4cb8649b", "Feed some ducks"],
      ["738f3d22-6f38-4059-9dd3-7fdd672acccd", "Swim with sharks"],
      ["be840a83-86f9-4ba2-87ae-3cd93f73f099", "Chill in a cafe"],
      ["107737a5-d694-43db-a082-0d71bdfc4105", "Observe a black hole"],
      ["30023b24-f08a-43d4-918a-aa8940cefb24", "Touch grass"],
      ["09402677-a01e-4f6b-9171-f8c533ec774f", "Paint together"],
      ["7e736467-63c4-4ff4-9989-54546b24cc6f", "Play some pool"]
    ]

    ~H"""
    <div class="flex" x-component="snap_carousel">
      <%= for [src, label] <- content do %>
      <button x-bind="button" x-cloak data-src={src} class="absolute flex w-screen h-screen shrink-0 snap-always snap-center" >
        <div class="absolute z-10 flex items-center justify-center w-full h-full p-16 select-none">
          <span class="font-bold [text-shadow:0_0_16px_#000] text-5xl md:text-7xl font-nunito"><%= label %></span>
        </div>
        <.uc_image src={src} class="object-cover w-full h-full shrink-0 brightness-75"/>
      </button>
      <% end %>
    </div>
    """
  end

  def avatar_profiles_section(assigns) do
    ~H"""
    <div x-component="avatar_profiles_section" class="flex flex-col items-center justify-center w-full h-full gap-8 mx-auto max-w-screen-2xl">
      <div class="flex flex-col items-center justify-center gap-8 text-center">
        <h1 class="mt-8 text-5xl font-bold md:text-7xl font-montserrat">Avatar profiles</h1>
        <span x-bind="span" class="text-2xl sm:text-3xl md:text-5xl leading-snug font-nunito max-w-4xl h-[8ch] md:h-[5ch]">
          When you can choose how you look, it's personality that makes the difference.
        </span>
      </div>
      <img src="/images/profile-showcase.png" class="lg:h-[60vh]"/>
    </div>
    """
  end

  def testimonial_marquee(assigns) do
    images = [
      "a68e9441-8430-4a33-a067-04313d4d260c",
      "5e0d4116-2e60-4ae9-b865-3ce7d17c68ec",
      "01db5707-2aac-45cd-a80c-223c6e1b93f2",
      "b8ea7c5b-5110-46b7-8635-38728e8a77aa",
      "eea60bde-de1a-4f43-9f02-a218fddf2a73",
      "ad5cba2d-03ff-43eb-9cf3-e6986bb0be54",
      "40122187-d831-4131-ab8e-ee0f5544ce73",
      "17b87f45-0ef8-4dfa-80c4-c23450f09b30",
      "28eaf327-e2bd-4fd2-a7f9-4dd6be153bfc",
      "5bbf00fc-2c97-49b2-9f16-9d3c1a180ae8",
      "f3b27da8-4f36-4c7f-bd65-094421d28f22",
      "c0d8ad7f-a6df-4de8-a429-a8fa729bf447",
      "9f2de017-6b5a-4ca9-b858-95057889fd64",
      "b8b087b9-3ab3-4a05-b01a-166b502789f5"
    ]

    ~H"""
    <div x-component="testimonial_marquee" class="flex overflow-x-hidden">
    <%= for src <- images do %>
      <.uc_image src={src} class="object-cover h-full" />
    <% end %>
    </div>
    """
  end

  def testimonial_press(assigns) do
    images = [
      "29a2f1bc-0b3e-469a-aa11-0de69b75b629",
      "257a7f46-a6c1-4bee-9a3e-5dbdfe9d2a66",
      "18e4a7ad-625a-42f6-b581-d14386ced012",
      "db2eb424-e837-4d64-85e0-e49409ae33a6",
      "54ffe640-1c54-4d8f-a754-4c7b7ca82456",
      "b779aa38-8592-48cd-8f9b-88228c5abc21",
      "1a03f086-7a3a-41f6-a7cf-035a83c10fa4",
      "fd92ab0f-d264-4a69-813f-bea13def2c46"
    ]

    ~H"""
    <div class="flex flex-wrap items-center gap-8 m-8 md:m-16 justify-evenly md:flex-nowrap">
    <%= for src <- images do %>
      <.uc_image src={src} class="w-24 md:w-full "/>
    <% end %>
    </div>
    """
  end
end

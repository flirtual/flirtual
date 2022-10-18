defmodule FlirtualWeb.Components.Footer do
  use Phoenix.Component

  import FlirtualWeb.Components.Icon

  defp footer_list_icon_link(assigns) do
    ~H"""
    <a {assigns} class="hover:brightness-90 cursor-pointer">
      <.icon name={@icon} type={assigns[:icon_type] || "solid"} class="w-8" />
    </a>
    """
  end

  defp footer_list_link(assigns) do
    ~H"""
    <li class="text-lg md:text-xl">
      <a class="hover:underline cursor-pointer" {assigns}>
        <%= @label %>
      </a>
    </li>
    """
  end

  def footer(assigns) do
    ~H"""
    <footer class="flex justify-center w-full px-8 py-16 md:px-16 font-nunito bg-brand-gradient">
    <div class="flex flex-col w-full max-w-screen-lg gap-4 md:gap-8 p-4">
        <div class="flex gap-4 md:mx-auto md:justify-center">
          <.footer_list_icon_link icon="envelope" icon_type="solid" @click="() => FreshworksWidget('open')"/>
          <.footer_list_icon_link icon="discord" href="/discord"/>
          <.footer_list_icon_link icon="twitter" href="https://twitter.com/getflirtual"/>
        </div>
        <ul class="flex flex-wrap max-w-screen-sm md:mx-auto md:justify-center gap-x-4 gap-y-1">
          <.footer_list_link label="Events" href="/events"/>
          <.footer_list_link label="Support" @click="() => FreshworksWidget('open')"/>
          <.footer_list_link label="Status" href="https://status.flirtu.al/"/>
          <.footer_list_link label="Press" href="/press"/>
          <.footer_list_link label="Branding" href="/branding"/>
          <.footer_list_link label="Developers" href="/developers"/>
          <.footer_list_link label="About us" href="/about"/>
          <.footer_list_link label="Terms of Service" href="/terms"/>
          <.footer_list_link label="Privacy Policy" href="/privacy"/>
        </ul>
        <div class="flex justify-between md:text-lg">
          <span class="hidden sm:inline">Made with ♥︎ in VR</span>
          <span>© <%= DateTime.utc_now.year %> <a class="hover:underline" href="https://studiopaprika.io/">Studio Paprika</a></span>
        </div>
    </div>
    </footer>
    """
  end
end

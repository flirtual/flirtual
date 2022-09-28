defmodule FlirtualWeb.Components.Footer do
  use Phoenix.Component

  import FlirtualWeb.Components.Icon

  defp footer_list_icon_link(assigns) do
    ~H"""
    <a href={assigns[:href]} class="hover:brightness-90 ">
      <.icon name={@icon} type={assigns[:icon_type] || "solid"} class="w-8" />
    </a>
    """
  end

  defp footer_list_link(assigns) do
    ~H"""
    <li class="text-lg md:text-xl">
      <a class="hover:underline" href={assigns[:href]}>
        <%= @label %>
      </a>
    </li>
    """
  end

  def footer(assigns) do
    ~H"""
    <footer class="flex justify-center w-full px-8 py-16 md:px-16 font-nunito bg-gradient-to-r from-brand-coral to-brand-pink">
			<div class="flex flex-col w-full max-w-screen-lg gap-8 p-4">
        <div class="flex gap-4 md:mx-auto md:justify-center">
          <.footer_list_icon_link icon="envelope" icon_type="solid" href="/support"/>
          <.footer_list_icon_link icon="discord" href="/discord"/>
          <.footer_list_icon_link icon="twitter" href="https://twitter.com/getflirtual"/>
        </div>
        <ul class="flex flex-wrap max-w-screen-sm md:mx-auto md:justify-center gap-x-4 gap-y-1">
          <.footer_list_link label="Events" href="/events"/>
          <.footer_list_link label="Support"/>
          <.footer_list_link label="Status" href="https://status.flirtu.al/"/>
          <.footer_list_link label="Press" href="/press"/>
          <.footer_list_link label="Branding" href="/branding"/>
          <.footer_list_link label="Developers" href="/developers"/>
          <.footer_list_link label="About us" href="/about"/>
          <.footer_list_link label="Terms of Service" href="/terms"/>
          <.footer_list_link label="Privacy Policy" href="/privacy"/>
        </ul>
        <div class="flex justify-between md:text-lg">
          <span>Made with ♥︎ in VR</span>
          <span>© <%= DateTime.utc_now.year %> <a class="hover:underline" href="https://studiopaprika.io/">Studio Paprika</a></span>
        </div>
			</div>
		</footer>
    """
  end
end

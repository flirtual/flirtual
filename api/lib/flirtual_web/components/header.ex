defmodule FlirtualWeb.Components.Header do
  use Phoenix.Component

  import FlirtualWeb.Components.Icon

  defp header_link(assigns) do
    icon = assigns.icon |> List.first

    ~H"""
    <a href={assigns.href} class="group focus:outline-none">
      <.icon {icon} class="w-16 p-2 rounded-full text-brand-pink hover:text-white group-focus:text-white hover:bg-brand-gradient group-focus:bg-brand-gradient"/>
    </a>
    """
  end

  def header(assigns) do
    ~H"""
    <header class="flex justify-center w-full px-8 py-4 md:px-16 font-nunito bg-brand-gradient rounded-b-half shadow-brand-1">
      <div class="flex gap-4 px-4 py-2 bg-white rounded-full">
        <.header_link href="/">
          <:icon name="home" type="solid"/>
        </.header_link>
        <.header_link href="/login">
          <:icon name="arrow-left-on-rectangle" type="solid"/>
        </.header_link>
      </div>
    </header>
    """
  end
end

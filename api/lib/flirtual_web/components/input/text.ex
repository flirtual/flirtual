defmodule FlirtualWeb.Components.Input.Text do
  use Phoenix.Component

  def input_text(assigns) do
    ~H"""
    <input type={assigns[:type] || "text"} name={assigns.name} id={assigns.name} class="border-none font-nunito bg-brand-grey rounded-xl shadow-brand-1 focus:ring-2 focus:ring-brand-coral text-2xl px-4 py-2"/>
    """
  end
end

defmodule FlirtualWeb.Components.Input.Checkbox do
  use Phoenix.Component

  def input_checkbox(assigns) do
    ~H"""
    <input
      type="checkbox"
      id={assigns.name}
      name={assigns.name}
      class="relative flex w-8 h-8 focus:ring-brand-coral rounded-xl checked:bg-brand-gradient text-white shadow-brand-1 border-4 border-brand-black items-center justify-center text-2xl checked:after:content-['\2714']"
    />
    """
  end
end

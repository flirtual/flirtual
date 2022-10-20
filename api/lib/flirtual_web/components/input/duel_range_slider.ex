defmodule FlirtualWeb.Components.Input.DuelRangeSlider do
  use Phoenix.Component

  import FlirtualWeb.Utilities

  defp range_input(assigns) do
    ~H"""
    <input {attr_merge(assigns, %{
      type: "range",
      class: ["absolute w-full bg-transparent appearance-none pointer-events-none range-thumb:bg-brand-gradient range-thumb:pointer-events-auto range-thumb:border-none range-thumb:w-6 range-thumb:h-6 range-thumb:shadow-brand-1 range-thumb:rounded-full"]
    })}>
    """
  end

  def duel_range_slider(assigns) do
    assigns =
      assigns
      |> assign_new(:step, fn -> 1 end)

    min = assigns.min |> List.first()
    min_default = min[:default] || 0
    min_limit = min[:limit] || 0

    max = assigns.max |> List.first()
    max_default = max[:default] || 100
    max_limit = max[:limit] || 100

    ~H"""
    <div x-component="duel_range_slider" x-bind="xRoot" {attr_merge(assigns, %{
      class: ["relative flex items-center h-6"],
      "data-min-default": min_default,
      "data-max-default": max_default,
      "data-min-limit": min_limit,
      "data-max-limit": max_limit
    }, [:min, :max])}>
      <div class="absolute w-full h-2 rounded-full bg-brand-black shadow-brand-1"/>
      <div x-bind="xSelection" class="absolute h-2 rounded-full bg-brand-gradient"/>
      <.range_input x-bind="xLowerInput"/>
      <.range_input x-bind="xUpperInput"/>
    </div>
    """
  end
end

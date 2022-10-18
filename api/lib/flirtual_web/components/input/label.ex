defmodule FlirtualWeb.Components.Input.Label do
  use Phoenix.Component

  import FlirtualWeb.Utilities

  def input_label(assigns) do
    assigns = assigns |> assign_new(:hint, fn -> [] end)

    ~H"""
    <label
      class={cls(["font-nunito select-none", assigns[:inline] && "flex flex-col"])}
      for={assigns.for}
    >
      <span class="text-xl">
        <%= render_slot(@inner_block) %>
      </span>
      <%= if length(assigns.hint) !== 0 do %>
      <span class={cls(["text-gray-700", List.first(assigns.hint)[:class]])}>
        <%= render_slot(@hint) %>
      </span>
      <% end %>
    </label>
    """
  end
end

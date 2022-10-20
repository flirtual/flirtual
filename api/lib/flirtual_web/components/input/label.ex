defmodule FlirtualWeb.Components.Input.Label do
  use Phoenix.Component

  import FlirtualWeb.Utilities

  def input_label(assigns) do
    assigns = assigns |> assign_new(:hint, fn -> [] end)
    hint = assigns.hint |> List.first

    ~H"""
    <label {attr_merge(assigns, %{
      class: ["font-nunito select-none", assigns[:inline] && "flex flex-col"],
      for: assigns.for
    }, [:hint])}>
      <span class="text-xl">
        <%= render_slot(@inner_block) %>
      </span>
      <%= if not is_nil(hint) do %>
      <span {attr_merge(hint, %{class: ["text-gray-700"]})}>
        <%= render_slot(@hint) %>
      </span>
      <% end %>
    </label>
    """
  end
end

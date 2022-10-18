defmodule FlirtualWeb.Components.Model do
  use Phoenix.Component

  def model(assigns) do
    ~H"""
    <div class="w-full sm:w-fit">
      <div class="bg-brand-gradient text-white rounded-t-[4rem] pt-8 px-16 pb-4 w-fit shadow-brand-1">
        <span class="text-4xl font-montserrat">
          <%= render_slot(@title) %>
        </span>
      </div>
      <div class="w-full sm:shadow-brand-1 px-8 sm:px-16 py-10 flex flex-col overflow-hidden bg-white border-4 rounded-tl-none rounded-3xl border-brand-coral">
        <%= render_slot(@inner_block) %>
      </div>
    </div>
    """
  end
end

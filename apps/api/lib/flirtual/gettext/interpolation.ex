defmodule Flirtual.Gettext.Interpolation do
  @moduledoc """
  `Gettext.Interpolation.Default` with `%{brand_name}` bound in every message.
  """

  @behaviour Gettext.Interpolation

  alias Gettext.Interpolation.Default

  @impl true
  def runtime_interpolate(message, bindings),
    do: Default.runtime_interpolate(message, with_brand_name(bindings))

  @impl true
  defmacro compile_interpolate(message_type, message, bindings) do
    quote do
      require Gettext.Interpolation.Default

      Gettext.Interpolation.Default.compile_interpolate(
        unquote(message_type),
        unquote(message),
        unquote(__MODULE__).with_brand_name(unquote(bindings))
      )
    end
  end

  @impl true
  defdelegate message_format, to: Default

  def with_brand_name(bindings), do: Map.put_new(bindings, :brand_name, Flirtual.Brand.name())
end

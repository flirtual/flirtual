defmodule Flirtual.ICU do
  @moduledoc """
  Formats the data's text, which is ICU MessageFormat like the frontend's, with `{brand_name}`
  bound in every message.
  """

  alias Flirtual.Brand

  def format(message, locale, bindings \\ %{}) when is_binary(message) and is_binary(locale) do
    # ex_cldr_messages parses plural keywords with `String.to_existing_atom/1`, so they exist
    # only once its plural rules are loaded.
    Code.ensure_loaded!(Flirtual.Cldr.Number.Cardinal)

    bindings = bindings |> Map.new() |> Map.put_new(:brand_name, Brand.name())
    {:ok, text} = Cldr.Message.format(message, bindings, backend: Flirtual.Cldr, locale: locale)
    IO.iodata_to_binary(text)
  end
end

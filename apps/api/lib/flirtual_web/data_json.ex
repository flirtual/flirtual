defmodule FlirtualWeb.DataJSON do
  alias Flirtual.Data.Locale

  def metadata(entry) do
    entry
    |> Map.drop([:__struct__, :id, :internal])
    |> Map.reject(fn {_, value} -> is_nil(value) end)
  end

  def entry(entry), do: entry |> metadata() |> Map.put(:id, entry.id)

  def entry(%module{id: id}, locale) do
    locale = if locale && Locale.get(locale), do: locale, else: Locale.default().id
    texts = module.texts()

    id
    |> module.get(locale)
    |> entry()
    |> Map.new(fn {key, value} ->
      {key, if(key in texts, do: Flirtual.ICU.format(value, locale), else: value)}
    end)
  end
end

# Outside the data routes, an entry is sent as its id.
for module <- Flirtual.Data.modules() do
  defimpl Jason.Encoder, for: module do
    def encode(entry, options), do: Jason.Encode.string(entry.id, options)
  end
end

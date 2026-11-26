defmodule Flirtual.Data.Definition do
  @moduledoc false

  def of(%{name: name, schema: schema} = file) do
    fields = schema["properties"] |> Map.keys() |> Enum.map(&String.to_atom/1)

    texts =
      file.fallback
      |> Map.values()
      |> Enum.flat_map(&Map.keys/1)
      |> Enum.uniq()
      |> Enum.map(&String.to_atom/1)

    structs = structs(file, fields ++ texts)

    quote do
      @moduledoc "An entry of `#{unquote(name)}.json`."

      @enforce_keys [:id]
      defstruct [:id, internal: %{}] ++ unquote(Enum.sort((fields ++ texts) -- [:internal]))

      @type t :: %__MODULE__{}

      @doc "`#{unquote(name)}`, the file's name."
      def file, do: unquote(name)

      @doc "The JSON Schema in `meta.json` that each entry follows."
      def schema, do: unquote(Macro.escape(schema))

      @doc "The fields that hold text, which every locale can translate."
      def texts, do: unquote(Enum.sort(texts))

      @doc "Every entry, with its text in the default locale."
      def all, do: Tuple.to_list(entries())

      @doc "Every entry, with its text in `locale`, filled in from the default locale's."
      def all(locale) when is_binary(locale), do: Enum.map(all(), &translate(&1, locale))

      def ids, do: unquote(Enum.map(structs, & &1.id))

      unquote(default(structs))

      unquote(endpoint(file))

      @doc "The entry with an id, with its text in the default locale, or `nil`."
      def get(id)
      unquote_splicing(Enum.with_index(structs, &get/2))
      def get(id) when is_binary(id), do: nil

      @doc "The entry with an id, with its text in `locale`, or `nil`."
      def get(id, locale) when is_binary(id) and is_binary(locale) do
        with %{} = entry <- get(id), do: translate(entry, locale)
      end

      # Behind a function, so the compiler can't fold `elem/2` and `Tuple.to_list/1` into copies.
      defp entries, do: unquote(Macro.escape(List.to_tuple(structs)))

      unquote(translate(file))
    end
  end

  defp structs(%{module: module, entries: entries, fallback: fallback}, fields) do
    blank =
      Map.new(fields, &{&1, nil})
      |> Map.merge(%{__struct__: module, internal: %{}})

    for {id, entry} <- entries do
      blank
      |> Map.merge(atomized(entry))
      |> Map.merge(atomized(Map.get(fallback, id, %{})))
      |> Map.put(:id, id)
    end
  end

  defp atomized(map), do: Map.new(map, fn {key, value} -> {String.to_atom(key), value} end)

  defp default(structs) do
    case Enum.find(structs, &(Map.get(&1, :default) == true)) do
      nil -> nil
      %{id: id} -> quote(do: def(default, do: get(unquote(id))))
    end
  end

  defp endpoint(%{endpoint: nil}), do: nil

  defp endpoint(%{endpoint: endpoint}),
    do: quote(do: def(endpoint, do: unquote(Macro.escape(endpoint))))

  defp get(struct, index) do
    quote(do: def(get(unquote(struct.id)), do: elem(entries(), unquote(index))))
  end

  defp translate(%{overlays: overlays}) when overlays == %{} do
    quote(do: defp(translate(entry, _), do: entry))
  end

  defp translate(%{overlays: overlays}) do
    translations =
      Map.new(overlays, fn {locale, texts} ->
        {locale, Map.new(texts, fn {id, text} -> {id, atomized(text)} end)}
      end)

    quote do
      defp translate(entry, locale),
        do:
          Map.merge(entry, get_in(unquote(Macro.escape(translations)), [locale, entry.id]) || %{})
    end
  end
end

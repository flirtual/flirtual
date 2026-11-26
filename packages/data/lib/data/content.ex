defmodule Flirtual.Data.Content do
  @moduledoc false

  @root Path.expand("../../content", __DIR__)

  def paths, do: Path.wildcard(Path.join(@root, "*.json"))

  def files do
    paths = Enum.group_by(paths(), &(&1 |> segments() |> hd()))
    meta = paths |> Map.fetch!("meta") |> hd() |> read()
    names = paths |> Map.keys() |> List.delete("meta")

    if Enum.sort(Map.keys(meta)) != Enum.sort(names),
      do: raise(CompileError, description: "meta.json must describe exactly #{inspect(names)}")

    fallback =
      Enum.find_value(read(hd(paths["locales"])), fn {id, locale} -> locale["default"] && id end)

    files =
      for name <- names do
        %{"type" => type, "schema" => schema} = row = meta[name]
        {[base], overlays} = Enum.split_with(paths[name], &(length(segments(&1)) == 1))
        overlays = Map.new(overlays, &{&1 |> segments() |> List.last(), read(&1)})

        %{
          name: name,
          module:
            Module.concat(Flirtual.Data, type |> String.replace("-", "_") |> Macro.camelize()),
          schema: schema,
          endpoint: row["endpoint"] && %{order: row["endpoint"]["order"]},
          entries: base |> read() |> Enum.sort(),
          fallback: Map.get(overlays, fallback, %{}),
          overlays: Map.delete(overlays, fallback)
        }
      end

    case Enum.flat_map(files, &mismatches/1) do
      [] -> files
      mismatches -> raise CompileError, description: Enum.join(mismatches, "\n\n")
    end
  end

  defp mismatches(%{name: name, schema: schema, entries: entries} = file) do
    root = JSV.build!(schema, formats: true)

    # Text a locale adds where the default locale has none would be a field the struct lacks.
    texts = file.fallback |> Map.values() |> Enum.flat_map(&Map.keys/1)

    unknown =
      for {locale, overlay} <- file.overlays,
          {id, text} <- overlay,
          extra = Map.keys(text) -- texts,
          extra != [],
          do: "#{name}.#{locale}.json #{inspect(id)}: unknown text #{Enum.join(extra, ", ")}"

    unknown ++
      for {id, entry} <- entries,
          {:error, error} <- [JSV.validate(entry, root, cast: false)],
          do: "#{name}.json #{inspect(id)}: #{Exception.message(error)}"
  end

  defp segments(path), do: path |> Path.basename(".json") |> String.split(".")

  defp read(path), do: path |> File.read!() |> JSON.decode!()
end

defmodule Flirtual.Order do
  # Each key breaks ties in the one before. An entry without a value for a key comes last in
  # either direction, and the id settles what's left.
  alias Flirtual.Data.Locale
  alias Flirtual.Popularity

  @default [{:curated, :asc}, {:name, :asc}]

  @keys %{"curated" => :curated, "name" => :name, "popularity" => :popularity}

  @locale Locale.default().id

  def default, do: @default

  def parse(module, keys) when is_atom(module) and is_list(keys) do
    allowed = Enum.map(module.endpoint().order, &String.trim_leading(&1, "-"))
    parsed = Enum.map(keys, &parse_key(&1, allowed))

    if parsed != [] and :error not in parsed, do: {:ok, parsed}, else: :error
  end

  defp parse_key("-" <> name, allowed), do: key(name, allowed, :desc)
  defp parse_key(name, allowed), do: key(name, allowed, :asc)

  defp key(name, allowed, direction),
    do: if(name in allowed, do: {Map.fetch!(@keys, name), direction}, else: :error)

  def sort(entries, keys \\ @default, locale \\ nil)
  def sort([], _, _), do: []

  def sort([%module{} | _] = entries, keys, locale) do
    values =
      Enum.map(keys, fn {name, direction} ->
        {values(name, module, entries, locale), direction}
      end)

    Enum.sort(entries, fn a, b ->
      case compare(values, a, b, locale || @locale) do
        :eq -> a.id <= b.id
        order -> order == :lt
      end
    end)
  end

  defp values(:curated, _, entries, _), do: Map.new(entries, &{&1.id, &1.internal["curated"]})
  defp values(:popularity, _, _, _), do: Popularity.scores()

  defp values(:name, module, entries, locale) do
    Map.new(entries, fn entry ->
      translated = if locale, do: module.get(entry.id, locale), else: entry
      {entry.id, Map.get(translated, :name) || entry.id}
    end)
  end

  defp compare([], _, _, _), do: :eq

  defp compare([{values, direction} | rest], a, b, locale) do
    case {values[a.id], values[b.id]} do
      {same, same} ->
        compare(rest, a, b, locale)

      {nil, _} ->
        :gt

      {_, nil} ->
        :lt

      {x, y} ->
        case compare_values(x, y, locale) do
          :eq -> compare(rest, a, b, locale)
          order -> directed(order, direction)
        end
    end
  end

  defp compare_values(x, y, locale) when is_binary(x) and is_binary(y),
    do: Cldr.Collation.compare(x, y, locale: locale)

  defp compare_values(x, y, _) when x < y, do: :lt
  defp compare_values(x, y, _) when x > y, do: :gt
  defp compare_values(_, _, _), do: :eq

  defp directed(order, :asc), do: order
  defp directed(:lt, :desc), do: :gt
  defp directed(:gt, :desc), do: :lt
end

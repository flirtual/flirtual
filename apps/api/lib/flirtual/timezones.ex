defmodule Flirtual.Timezones do
  # The only country table tz ships is zone1970.tab, which drops zones that have
  # been merged into a link, leaving ~100 countries without their own zone. We
  # want the backwards-compatible zone.tab data, and restore it from the links.

  @backward Path.join(Tz.IanaDataDir.relevant_tzdata_dir_path(), "backward")
  @external_resource @backward

  backward = @backward |> File.read!() |> String.split("\n")

  # Every section heading is a comment, and so is the column legend beneath it.
  heading? = &(String.starts_with?(&1, "# ") and not String.starts_with?(&1, "# Link"))

  # Links under this heading are the merged zones we use to restore zone.tab.
  @zone_tab_heading "# Pre-2013 practice, which typically had a Zone per zone.tab line"

  @zone_tab_only backward
                 |> Enum.drop_while(&(&1 != @zone_tab_heading))
                 |> Enum.drop(1)
                 |> Enum.take_while(&(not heading?.(&1)))
                 |> Enum.filter(&String.starts_with?(&1, "Link"))
                 |> Enum.map(&(&1 |> String.split() |> Enum.at(2)))

  if @zone_tab_only == [] do
    raise "no links under #{inspect(@zone_tab_heading)} in #{@backward}"
  end

  # Ignore Etc/* offsets.
  @timezones TzExtra.time_zone_ids()
             |> Enum.reject(&String.starts_with?(&1, "Etc/"))
             |> Kernel.++(@zone_tab_only)
             |> Enum.sort()

  # A Link line can't point at another link, so it names the end of the chain,
  # which may be in a different country than the zone it should have pointed at.
  # "#= TARGET1" preserves that intended zone; use it when we offer it.
  @link_hints backward
              |> Enum.flat_map(fn line ->
                case String.split(line) do
                  ["Link", _target, link_name, "#=", hint] -> [{link_name, hint}]
                  _ -> []
                end
              end)
              |> Map.new()

  # Remaining links that merged across a border. `backward` records no country
  # for them, so we need to name their zone.tab city explicitly.
  @alias_overrides %{
    "Africa/Timbuktu" => "Africa/Bamako",
    "America/Coral_Harbour" => "America/Atikokan",
    "Antarctica/South_Pole" => "Antarctica/McMurdo",
    "Atlantic/Jan_Mayen" => "Arctic/Longyearbyen",
    "Pacific/Yap" => "Pacific/Chuuk"
  }

  # Browser may report legacy zones we don't offer. Map to the most specific one
  # we do: an override, else the intended target, else the chain end.
  @aliases TzExtra.time_zone_ids(include_aliases: true)
           |> Enum.reject(&(&1 in @timezones))
           |> Enum.flat_map(fn id ->
             canonical =
               case TzExtra.canonical_time_zone_id(id) do
                 {:ok, canonical} -> canonical
                 {:error, _} -> nil
               end

             case Enum.find(
                    [@alias_overrides[id], @link_hints[id], canonical],
                    &(&1 in @timezones)
                  ) do
               nil -> []
               listed -> [{id, listed}]
             end
           end)
           |> Map.new()

  @aliases_by_timezone Enum.group_by(@aliases, &elem(&1, 1), &elem(&1, 0))

  def list, do: @timezones

  def listed?(timezone) when is_atom(timezone), do: listed?(Atom.to_string(timezone))
  def listed?(timezone) when is_binary(timezone), do: timezone in @timezones

  def aliases_of(timezone) when is_binary(timezone),
    do: Map.get(@aliases_by_timezone, timezone, [])

  # Nil for offset-only ids (UTC, Etc/GMT+5) which name no city.
  def resolve(timezone) when is_atom(timezone), do: resolve(Atom.to_string(timezone))

  def resolve(timezone) when is_binary(timezone) do
    if listed?(timezone), do: timezone, else: @aliases[timezone]
  end
end

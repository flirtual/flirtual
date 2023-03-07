defmodule Flirtual.Utilities do
  @year_in_milliseconds 3.154e+10
  @year_in_days 365

  def get_years_ago(years) do
    Date.utc_today() |> Date.add(-(years * @year_in_days))
  end

  def get_years_since(%Date{} = date) do
    (Date.diff(Date.utc_today(), date) / @year_in_days) |> floor
  end

  def get_years_since(%NaiveDateTime{} = date),
    do: get_years_since(NaiveDateTime.to_date(date))

  def map_exclude_keys(map, keys) do
    Map.filter(map, &(elem(&1, 0) not in keys))
  end

  def filter_by(list, key, values) when is_list(values) do
    Enum.filter(list, &(&1[key] in values))
  end

  def filter_by(list, key, value) do
    Enum.filter(list, &(&1[key] === value))
  end

  def exclude_by(list, key, values) when is_list(values) do
    Enum.filter(list, &(&1[key] not in values))
  end

  def exclude_by(list, key, value) do
    Enum.filter(list, &(&1[key] !== value))
  end

  def to_atom(value) do
    try do
      String.to_existing_atom(value)
    rescue
      ArgumentError -> nil
    end
  end
end

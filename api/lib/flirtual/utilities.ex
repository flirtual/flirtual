defmodule Flirtual.Utilities do
  @year_in_days 365

  def get_years_ago(years) do
    Date.utc_today() |> Date.add(-(years * @year_in_days))
  end

  def get_years_since(%Date{} = date) do
    (Date.diff(Date.utc_today(), date) / @year_in_days) |> floor
  end

  def get_years_since(%DateTime{} = date),
    do: get_years_since(DateTime.to_date(date))

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

  defmacro is_uuid(value) do
    quote do
      is_binary(unquote(value)) and byte_size(unquote(value)) == 36 and
        binary_part(unquote(value), 8, 1) == "-" and binary_part(unquote(value), 13, 1) == "-" and
        binary_part(unquote(value), 18, 1) == "-" and binary_part(unquote(value), 23, 1) == "-"
    end
  end

  def to_atom(value, default \\ nil) do
    try do
      String.to_existing_atom(value)
    rescue
      ArgumentError -> default
    end
  end
end

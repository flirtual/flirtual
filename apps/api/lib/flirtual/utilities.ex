defmodule Flirtual.Utilities do
  def skip_invalid_leap_day(year, month, day) do
    if not Date.leap_year?(Date.new!(year, 1, 1)) and month == 2 and day == 29 do
      Date.new!(year, 3, 1)
    else
      Date.new!(year, month, day)
    end
  end

  def get_years_ago(years) do
    today = Date.utc_today()
    skip_invalid_leap_day(today.year - years, today.month, today.day)
  end

  def get_years_since(nil), do: 0

  def get_years_since(%Date{} = date) do
    today = Date.utc_today()
    date_this_year = skip_invalid_leap_day(today.year, date.month, date.day)

    if Date.compare(today, date_this_year) == :lt do
      today.year - date.year - 1
    else
      today.year - date.year
    end
  end

  def get_years_since(%DateTime{} = date),
    do: get_years_since(DateTime.to_date(date))

  def get_years_since(%NaiveDateTime{} = date),
    do: get_years_since(NaiveDateTime.to_date(date))

  def timezone_offset(timezone) when is_atom(timezone) do
    timezone_offset(Atom.to_string(timezone))
  end

  def timezone_offset(timezone) when is_binary(timezone) do
    now = DateTime.utc_now()
    {:ok, dt} = DateTime.shift_zone(now, timezone)
    dt.utc_offset + dt.std_offset
  end

  def map_exclude_keys(map, keys) do
    Map.filter(map, &(elem(&1, 0) not in keys))
  end

  def exclude_nil(map) do
    Map.reject(map, fn {_, value} -> is_nil(value) end)
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

  def clamp(number, minimum, maximum) do
    number
    |> max(minimum)
    |> min(maximum)
  end

  defmacro is_uid(value) do
    quote do
      is_uuid(unquote(value)) or is_shortuuid(unquote(value))
    end
  end

  defmacro is_uuid(value) do
    quote do
      is_binary(unquote(value)) and byte_size(unquote(value)) == 36 and
        binary_part(unquote(value), 8, 1) == "-" and binary_part(unquote(value), 13, 1) == "-" and
        binary_part(unquote(value), 18, 1) == "-" and binary_part(unquote(value), 23, 1) == "-"
    end
  end

  defmacro is_shortuuid(value) do
    quote do
      is_binary(unquote(value)) and byte_size(unquote(value)) == 22
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

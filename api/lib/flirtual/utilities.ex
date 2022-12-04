defmodule Flirtual.Utilities do
  @year_in_milliseconds 3.154e+10

  def get_years_since(date) do
    floor(DateTime.diff(DateTime.utc_now(), date, :millisecond) / @year_in_milliseconds)
  end

  def to_atom(value) do
    try do
      IO.inspect(value)
      String.to_existing_atom(value)
    rescue
      ArgumentError -> nil
    end
  end

end

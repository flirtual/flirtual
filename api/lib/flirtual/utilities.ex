defmodule Flirtual.Utilities do
  @year_in_milliseconds 3.154e+10

  def get_years_since(date) do
    floor(DateTime.diff(DateTime.utc_now(), date, :millisecond) / @year_in_milliseconds)
  end
end

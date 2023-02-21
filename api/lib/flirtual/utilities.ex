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

  def to_atom(value) do
    try do
      String.to_existing_atom(value)
    rescue
      ArgumentError -> nil
    end
  end
end

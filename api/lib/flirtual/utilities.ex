defmodule Flirtual.Utilities do
  import Ecto.Changeset

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

  def cast_arbitrary(data, attrs) do
    cast({%{}, data}, attrs, Map.keys(data))
  end

  def append_changeset_errors(changeset_a, changeset_b) do
    %{
      changeset_a
      | errors: changeset_b.errors ++ changeset_a.errors,
        valid?: changeset_b.valid?
    }
  end

  def append_changeset(changeset_a, changeset_b, changes_fn \\ & &1) do
    changeset_a
    |> append_changeset_errors(changeset_b)
    |> change(changes_fn.(changeset_b.changes))
  end

  def map_exclude_keys(map, keys) do
    Map.filter(map, &(elem(&1, 0) not in keys))
  end

  def to_atom(value) do
    try do
      String.to_existing_atom(value)
    rescue
      ArgumentError -> nil
    end
  end
end

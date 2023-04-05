defmodule Flirtual.Utilities.Changeset do
  alias Ecto.UUID
  import Ecto.Changeset

  def validate_uuid(changeset, field) do
    validate_change(changeset, field, fn field, value ->
      case UUID.dump(value) do
        :error -> [{field, "is not a valid uuid"}]
        {:ok, _} -> []
      end
    end)
  end

  def validate_uuids(changeset, field) do
    validate_change(changeset, field, fn field, values ->
      if Enum.any?(values, fn value ->
           case UUID.dump(value) do
             :error -> true
             {:ok, _} -> false
           end
         end) do
        [{field, "contains an invalid uuid"}]
      else
        []
      end
    end)
  end

  def validate_predicate(changeset, predicate, {_, _} = keys),
    do: validate_predicate(changeset, predicate, keys, [])

  def validate_predicate(changeset, predicate, {a, b}, options) do
    default_field = (is_atom(a) and a) || (is_atom(b) and b) || nil

    changeset
    |> validate_predicate(
      predicate,
      Keyword.merge(
        options,
        field: Keyword.get(options, :field, default_field),
        values: {
          evaluate_predicate_key(changeset, a),
          evaluate_predicate_key(changeset, b)
        }
      )
    )
  end

  defp evaluate_predicate_key(changeset, {:value, value}), do: value
  defp evaluate_predicate_key(changeset, value), do: get_field(changeset, value)

  defp evaluate_predicate(:equal, {a, b}), do: a === b
  defp evaluate_predicate(:not_equal, {a, b}), do: a !== b
  defp evaluate_predicate(predicate, {a, b}) when is_function(predicate), do: predicate.(a, b)

  def validate_predicate(changeset, predicate, options \\ []) do
    values = Keyword.fetch!(options, :values)
    IO.inspect([predicate, values])

    if not evaluate_predicate(predicate, values) do
      add_error(
        changeset,
        Keyword.fetch!(options, :field),
        Keyword.get(options, :message, "is invalid")
      )
    else
      changeset
    end
  end

  def validate_changed(changeset, field, options \\ []) do
    if get_field(changeset, field) === get_change(changeset, field) do
      add_error(changeset, field, Keyword.get(options, :message, "did not change"))
    else
      changeset
    end
  end

  def cast_arbitrary(data, attrs) do
    cast({%{}, data}, attrs, Map.keys(data))
  end

  def append_changeset_errors(changeset_a, changeset_b) do
    %{
      changeset_a
      | errors: changeset_b.errors ++ changeset_a.errors,
        valid?: changeset_b.valid? and changeset_a.valid?
    }
  end

  def append_changeset(changeset_a, changeset_b, changes_fn \\ & &1) do
    changeset_a
    |> append_changeset_errors(changeset_b)
    |> change(changes_fn.(changeset_b.changes))
  end
end

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

  def validate_not_equal(changeset, field_a, field_b, opts \\ []) do
    if get_field(changeset, field_a) === get_field(changeset, field_b) do
      add_error(changeset, field_a, Keyword.get(opts, :message, "is invalid"))
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

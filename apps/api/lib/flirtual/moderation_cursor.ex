defmodule Flirtual.ModerationCursor do
  import Ecto.Query

  # Mod Queue position over events and reports, ordered by (created_at, kind, id).
  # Ids only order rows within a table, so ties across tables break on kind.
  @kinds ["event", "report"]

  def parse(nil), do: {:ok, nil}

  def parse(value) when is_binary(value) do
    with [at, kind, id] when kind in @kinds <- String.split(value, ","),
         {:ok, at, _} <- DateTime.from_iso8601(at),
         {:ok, id} <- Ecto.ShortUUID.cast(id) do
      {:ok, {DateTime.truncate(at, :second), kind, id}}
    else
      _ -> :error
    end
  end

  def parse(_), do: :error

  def validate(changeset, field) do
    Ecto.Changeset.validate_change(changeset, field, fn _, value ->
      if parse(value) == :error, do: [{field, "is invalid"}], else: []
    end)
  end

  # Rows of `own_kind` that come after the cursor in the given order.
  def where_after(query, nil, _, _), do: query

  def where_after(query, {at, kind, id}, kind, :desc),
    do: where(query, [row], row.created_at < ^at or (row.created_at == ^at and row.id < ^id))

  def where_after(query, {at, kind, id}, kind, :asc),
    do: where(query, [row], row.created_at > ^at or (row.created_at == ^at and row.id > ^id))

  def where_after(query, {at, kind, _}, own_kind, :desc) when own_kind < kind,
    do: where(query, [row], row.created_at <= ^at)

  def where_after(query, {at, _, _}, _, :desc), do: where(query, [row], row.created_at < ^at)

  def where_after(query, {at, kind, _}, own_kind, :asc) when own_kind > kind,
    do: where(query, [row], row.created_at >= ^at)

  def where_after(query, {at, _, _}, _, :asc), do: where(query, [row], row.created_at > ^at)
end

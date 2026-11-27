defmodule Flirtual.Entries do
  use Ecto.ParameterizedType

  @impl true
  def type(_), do: {:array, :string}

  @impl true
  def init(options), do: Keyword.fetch!(options, :of)

  @impl true
  def cast(values, module) when is_list(values) do
    values
    |> Enum.reduce_while([], fn value, entries ->
      case get(module, value) do
        nil -> {:halt, :error}
        entry -> {:cont, [entry | entries]}
      end
    end)
    |> case do
      :error -> :error
      entries -> {:ok, entries |> Enum.uniq_by(& &1.id) |> Flirtual.Order.sort()}
    end
  end

  def cast(_, _), do: :error

  # A stored id the data no longer has is dropped rather than failing the whole row, and so is
  # one stored twice.
  @impl true
  def load(nil, _, _), do: {:ok, []}

  def load(ids, _, module) when is_list(ids) do
    {:ok,
     ids
     |> Enum.uniq()
     |> Enum.map(&module.get/1)
     |> Enum.reject(&is_nil/1)
     |> Flirtual.Order.sort()}
  end

  def load(_, _, _), do: :error

  @impl true
  def dump(entries, _, module) when is_list(entries) do
    entries
    |> Enum.reduce_while([], fn entry, ids ->
      case get(module, entry) do
        nil -> {:halt, :error}
        %{id: id} -> {:cont, [id | ids]}
      end
    end)
    |> case do
      :error -> :error
      ids -> {:ok, ids |> Enum.reverse() |> Enum.uniq()}
    end
  end

  def dump(_, _, _), do: :error

  @impl true
  def equal?(a, b, _), do: ids(a) == ids(b)

  defp ids(nil), do: []
  defp ids(entries), do: Enum.map(entries, &id/1)

  defp id(%{id: id}), do: id
  defp id(id) when is_binary(id), do: id

  defp get(module, id) when is_binary(id), do: module.get(id)
  defp get(module, %module{} = entry), do: entry

  defp get(_, _), do: nil
end

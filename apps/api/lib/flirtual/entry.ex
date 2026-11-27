defmodule Flirtual.Entry do
  use Ecto.ParameterizedType

  @impl true
  def type(_), do: :string

  @impl true
  def init(options), do: Keyword.fetch!(options, :of)

  @impl true
  def cast(nil, _), do: {:ok, nil}
  def cast(%module{} = entry, module), do: {:ok, entry}

  def cast(id, module) when is_binary(id) do
    case module.get(id) do
      nil -> :error
      entry -> {:ok, entry}
    end
  end

  def cast(_, _), do: :error

  # A stored id the data no longer has loads as nothing rather than failing the whole row.
  @impl true
  def load(nil, _, _), do: {:ok, nil}
  def load(id, _, module) when is_binary(id), do: {:ok, module.get(id)}
  def load(_, _, _), do: :error

  @impl true
  def dump(nil, _, _), do: {:ok, nil}
  def dump(%module{id: id}, _, module), do: {:ok, id}
  def dump(_, _, _), do: :error

  @impl true
  def equal?(a, b, _), do: id(a) == id(b)

  defp id(%{id: id}), do: id
  defp id(nil), do: nil
end

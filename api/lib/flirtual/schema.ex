defmodule Flirtual.Schema do
  defmacro __using__(options \\ []) do
    quote bind_quoted: [options: options] do
      use Ecto.Schema
      @behaviour Access

      primary_key = Keyword.get(options, :primary_key, :id)

      @primary_key if(primary_key === false,
                     do: false,
                     else: {primary_key, :binary_id, autogenerate: true}
                   )

      @foreign_key_type :binary_id

      def fetch(term, key) do
        term
        |> Map.from_struct()
        |> Map.fetch(key)
      end

      def get(term, key, default) do
        term
        |> Map.from_struct()
        |> Map.get(key, default)
      end

      def get_and_update(data, key, function) do
        data
        |> Map.from_struct()
        |> Map.get_and_update(key, function)
      end

      def pop(data, key) do
        data
        |> Map.from_struct()
        |> Map.pop(key)
      end
    end
  end
end

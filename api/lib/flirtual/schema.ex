defmodule Flirtual.Schema do
  defmacro __using__(_) do
    quote do
      use Ecto.Schema

      @primary_key {:id, :binary_id, autogenerate: true}
      @foreign_key_type :binary_id
      @derive {Phoenix.Param, key: :id}

      @derive {Jason.Encoder, except: [:__meta__]}
    end
  end
end

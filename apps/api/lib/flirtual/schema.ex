defmodule Flirtual.Schema do
  @type using_options :: [
          {:primary_key, false, atom}
        ]

  @spec __using__(using_options) :: any
  defmacro __using__(options \\ []) do
    quote bind_quoted: [options: options] do
      use Ecto.Schema

      @behaviour Access

      @primary_key (with primary_key when not is_boolean(primary_key) <-
                           Keyword.get(options, :primary_key, :id) do
                      {primary_key, Ecto.ShortUUID, autogenerate: true}
                    end)

      @foreign_key_type Ecto.ShortUUID
      @timestamps_opts [type: :utc_datetime, inserted_at: :created_at]

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

defmodule Flirtual.EmbeddedSchema do
  defmacro __using__(_) do
    quote do
      use Ecto.Schema

      import Ecto.Changeset

      @behaviour Access
      @before_compile Flirtual.EmbeddedSchema

      @exclude [:id]
      @optional []
    end
  end

  defmacro __before_compile__(_) do
    quote do
      def create(_) do
        %__MODULE__{}
      end

      def prepare_changeset(attrs \\ %{}, context \\ %{}) do
        keys =
          __MODULE__.__schema__(:fields)
          |> Enum.filter(fn k -> k not in @exclude end)

        required_keys =
          keys
          |> Enum.filter(fn k -> k not in @optional end)

        create(context)
        |> cast(attrs, keys, empty_values: [nil])
        |> validate_required(required_keys)
      end

      def apply(attrs, options \\ []) do
        action = Keyword.get(options, :action, :update)
        context = Keyword.get(options, :context, %{})

        with {:ok, value} <-
               prepare_changeset(attrs, context)
               |> changeset(attrs, context)
               |> apply_action(action) do
          {:ok, value}
        end
      end

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

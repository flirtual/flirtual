defmodule Flirtual.Policy do
  @type action :: atom | String.t()
  @type auth_result :: :ok | :error | {:error, reason :: any} | true | false

  @callback authorize(action :: action, user :: any, params :: %{atom => any} | any) ::
              auth_result
  @callback transform(session :: any, params :: %{atom => any} | any) :: any
  @callback transform(key :: atom, session :: any, params :: %{atom => any} | any) :: any

  defmacro __using__(_) do
    quote do
      @before_compile Flirtual.Policy
      @behaviour Flirtual.Policy
    end
  end

  defmacro __before_compile__(opts) do
    quote do
      def transform(_, params), do: params
      def transform(key, _, params), do: Map.get(params, key, nil)
    end
  end
end

defmodule Flirtual.Policy do
  @type action :: atom | String.t()
  @type auth_result :: :ok | :error | {:error, reason :: any} | true | false

  @callback authorize(action :: action, conn :: any, params :: %{atom => any} | any) ::
              auth_result
  @callback transform(conn :: any, params :: %{atom => any} | any) :: any
  @callback transform(key :: atom, conn :: any, params :: %{atom => any} | any) :: any

  def can(conn, action, target, opts \\ []) do
    Bodyguard.permit(Keyword.get(opts, :policy) || target.__struct__, action, conn, target)
  end

  def can?(conn, action, target, opts \\ []) do
    Bodyguard.permit?(Keyword.get(opts, :policy) || target.__struct__, action, conn, target)
  end

  def cannot?(conn, action, target, opts \\ []) do
    not can?(conn, action, target, opts)
  end

  def transform(conn, target) do
    policy = target.__struct__
    target = apply(policy, :transform, [conn, target])

    Map.new(Map.keys(target), fn key ->
      value = apply(policy, :transform, [key, conn, target])
      {key, value}
    end)
  end

  defmacro __using__(_) do
    quote do
      @before_compile Flirtual.Policy
      @behaviour Flirtual.Policy
    end
  end

  defmacro __before_compile__(_) do
    quote do
      def transform(_, params), do: params
      def transform(key, _, params), do: Map.get(params, key, nil)
    end
  end
end

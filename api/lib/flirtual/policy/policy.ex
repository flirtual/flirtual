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

  def transform(conn, target, opts \\ [])

  def transform(_, %{__reference_key__: _} = target, _), do: target

  def transform(conn, target, opts) when is_list(target) do
    Enum.map(target, &transform(conn, &1, opts))
  end

  def transform(conn, %{__struct__: policy} = target, opts) do
    if Kernel.function_exported?(policy, :transform, 2) do
      reference_key = Keyword.get(opts, :reference_key)
      reference_value = Keyword.get(opts, :reference_value)

      target =
        if reference_key,
          do:
            Map.put(target, reference_key, reference_value)
            |> Map.put(:__reference_key__, reference_key),
          else: target

      target = apply(policy, :transform, [conn, target])

      if Kernel.function_exported?(policy, :transform, 3) do
        Map.new(Map.keys(target) |> List.delete(reference_key), fn key ->
          value = transform(conn, apply(policy, :transform, [key, conn, target]), opts)
          {key, value}
        end)
        |> Map.put(reference_key, reference_value)
      else
        target
      end
    else
      target
    end
  end

  def transform(_, target, _), do: target

  defmacro __using__(opts \\ []) do
    quote bind_quoted: [opts: opts] do
      @policy_options opts

      @before_compile Flirtual.Policy
      @behaviour Flirtual.Policy
    end
  end

  defmacro __before_compile__(_) do
    quote do
      def transform(_, target), do: target

      def transform(key, conn, target) do
        options = Keyword.merge(@policy_options, reference_value: target)
        Flirtual.Policy.transform(conn, Map.get(target, key, nil), options)
      end
    end
  end
end

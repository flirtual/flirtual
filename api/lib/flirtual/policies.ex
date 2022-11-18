defmodule Flirtual.Policies do
  def can(policy, action, user, params \\ []) do
    Bodyguard.permit(policy, action, user, params)
  end

  def transform(policy, conn, target \\ [])

  def transform(policy, conn, target) do
    target = apply(policy, :transform, [conn, target])

    Map.new(Map.keys(target), fn key ->
      value = apply(policy, :transform, [key, conn, target])
      {key, value}
    end)
  end
end

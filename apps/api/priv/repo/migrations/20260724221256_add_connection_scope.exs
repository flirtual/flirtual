defmodule Flirtual.Repo.Migrations.AddConnectionScope do
  use Ecto.Migration

  @backfill %{
    "discord" => ~w(identify email),
    "google" => ~w(openid email),
    "apple" => ~w(email)
  }

  def change do
    alter table(:connections) do
      add(:scope, {:array, :text})
    end

    for {type, scope} <- @backfill do
      literal = Enum.map_join(scope, ",", &"'#{&1}'")

      execute(
        "UPDATE connections SET scope = ARRAY[#{literal}]::text[] WHERE type = '#{type}'",
        "UPDATE connections SET scope = NULL WHERE type = '#{type}'"
      )
    end
  end
end

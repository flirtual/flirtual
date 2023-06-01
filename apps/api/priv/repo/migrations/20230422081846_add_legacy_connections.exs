defmodule Flirtual.Repo.Migrations.AddLegacyConnections do
  use Ecto.Migration

  def change do
    alter table(:profiles) do
      add :vrchat, :text
      add :discord, :text
    end
  end
end

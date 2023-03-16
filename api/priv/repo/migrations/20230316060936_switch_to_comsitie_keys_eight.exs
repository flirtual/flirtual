defmodule Flirtual.Repo.Migrations.SwitchToComsitieKeysEight do
  use Ecto.Migration

  def change do
    alter table(:profiles) do
      add :languages, {:array, :citext}, null: false, default: []
    end
  end
end

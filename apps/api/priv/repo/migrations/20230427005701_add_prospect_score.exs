defmodule Flirtual.Repo.Migrations.AddProspectScore do
  use Ecto.Migration

  def change do
    alter table(:prospects) do
      add :score, :float, null: false, default: 0.0
      add :completed, :boolean, null: false, default: false
      remove :updated_at
    end
  end
end

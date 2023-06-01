defmodule Flirtual.Repo.Migrations.AddFlags do
  use Ecto.Migration

  def change do
    create table(:flags, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false
      add :type, :citext, null: false
      add :flag, :citext, null: false

      timestamps(inserted_at: false)
    end

    create unique_index(:flags, [:type, :flag])
  end
end

defmodule Flirtual.Repo.Migrations.AddAttribute do
  use Ecto.Migration

  def change do
    create table(:attributes, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false
      add :type, :citext, null: false
      add :name, :text, null: false

      timestamps(inserted_at: false)
    end

    create unique_index(:attributes, [:type])
  end
end

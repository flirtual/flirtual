defmodule Flirtual.Repo.Migrations.AddHashes do
  use Ecto.Migration

  def change do
    create table(:hashes, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false
      add :user_id, references(:users, type: :uuid, on_delete: :nilify_all)
      add :type, :citext, null: false
      add :hash, :string, size: 64, null: false

      timestamps(inserted_at: false)
    end

    create unique_index(:hashes, [:user_id, :type, :hash])
    create index(:hashes, [:user_id])
  end
end

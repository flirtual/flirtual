defmodule Flirtual.Repo.Migrations.CreateProspects do
  use Ecto.Migration

  def change do
    create table(:prospects, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false

      add :profile_id,
          references(:profiles,
            type: :uuid,
            on_delete: :delete_all,
            column: :user_id,
            match: :full
          ),
          null: false

      add :target_id,
          references(:profiles,
            type: :uuid,
            on_delete: :delete_all,
            column: :user_id,
            match: :full
          ),
          null: false

      # love/friend
      add :kind, :citext, null: false

      timestamps(inserted_at: :created_at)
    end

    create index(:prospects, [:profile_id])
    create index(:prospects, [:target_id])

    create unique_index(:prospects, [:profile_id, :target_id, :kind])
  end
end

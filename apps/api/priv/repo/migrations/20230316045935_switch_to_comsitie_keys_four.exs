defmodule Flirtual.Repo.Migrations.SwitchToComsitieKeysFour do
  use Ecto.Migration

  def change do
    drop table(:connections), mode: :cascade

    create table(:connections, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false

      add :user_id,
          references(:users,
            type: :uuid,
            on_delete: :delete_all,
            match: :full
          ),
          null: false

      add :type, :citext, null: false
      add :external_id, :text, null: false

      timestamps(inserted_at: :created_at)
    end

    create unique_index(:connections, [:user_id, :type])

    drop table(:blocks), mode: :cascade

    create table(:blocks, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false

      add :profile_id,
          references(:users,
            type: :uuid,
            on_delete: :delete_all,
            match: :full
          ),
          null: false

      add :target_id,
          references(:users,
            type: :uuid,
            on_delete: :delete_all,
            match: :full
          ),
          null: false

      timestamps(updated_at: false, inserted_at: :created_at)
    end

    create index(:blocks, [:profile_id])
    create index(:blocks, [:target_id])
    create unique_index(:blocks, [:profile_id, :target_id])
  end
end

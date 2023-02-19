defmodule Flirtual.Repo.Migrations.FixProfileRelations do
  use Ecto.Migration

  def change do
    drop table(:user_profile_blocks)

    create table(:user_profile_blocks, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false

      add :profile_id,
          references(:user_profiles,
            type: :uuid,
            on_delete: :delete_all
          ),
          null: false

      add :target_id,
          references(:user_profiles,
            type: :uuid,
            on_delete: :delete_all
          ),
          null: false

      timestamps(updated_at: false, inserted_at: :created_at)
    end

    create index(:user_profile_blocks, [:profile_id])
    create index(:user_profile_blocks, [:target_id])
    create unique_index(:user_profile_blocks, [:profile_id, :target_id])

    drop table(:user_profile_likes)

    create table(:user_profile_likes, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false

      add :profile_id,
          references(:user_profiles,
            type: :uuid,
            on_delete: :delete_all
          ),
          null: false

      add :target_id,
          references(:user_profiles,
            type: :uuid,
            on_delete: :delete_all
          ),
          null: false

      add :type, :citext, null: false

      timestamps(inserted_at: :created_at)
    end

    create index(:user_profile_likes, [:profile_id])
    create index(:user_profile_likes, [:target_id])
    create unique_index(:user_profile_likes, [:profile_id, :target_id])

    drop table(:user_profile_passes)

    create table(:user_profile_passes, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false

      add :profile_id,
          references(:user_profiles,
            type: :uuid,
            on_delete: :delete_all
          ),
          null: false

      add :target_id,
          references(:user_profiles,
            type: :uuid,
            on_delete: :delete_all
          ),
          null: false

      timestamps(updated_at: false, inserted_at: :created_at)
    end

    create index(:user_profile_passes, [:profile_id])
    create index(:user_profile_passes, [:target_id])
    create unique_index(:user_profile_passes, [:profile_id, :target_id])
  end
end

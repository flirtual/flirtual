defmodule Flirtual.Repo.Migrations.LikesAndPassesMigration do
  use Ecto.Migration

  def change do
    drop table(:likes_and_passes)

    create table(:likes_and_passes, primary_key: false) do
      add :profile_id,
          references(:profiles,
            type: :uuid,
            on_delete: :delete_all,
            column: :user_id,
            match: :full
          ),
          null: false,
          primary_key: true

      add :target_id,
          references(:profiles,
            type: :uuid,
            on_delete: :delete_all,
            column: :user_id,
            match: :full
          ),
          null: false,
          primary_key: true

      # like/pass
      add :type, :citext, null: false

      # love/friend
      add :kind, :citext,
        null: false,
        primary_key: true

      timestamps(inserted_at: :created_at, updated_at: false)
    end

    create index(:likes_and_passes, [:profile_id])
    create index(:likes_and_passes, [:target_id])
  end
end

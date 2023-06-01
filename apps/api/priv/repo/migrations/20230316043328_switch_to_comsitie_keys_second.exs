defmodule Flirtual.Repo.Migrations.SwitchToComsitieKeysSecond do
  use Ecto.Migration

  def change do
    drop table(:likes_and_passes)

    create table(:likes_and_passes, primary_key: false) do
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

      # like/pass
      add :type, :citext, null: false

      # love/friend
      add :kind, :citext, null: false

      timestamps(inserted_at: :created_at)
    end

    create index(:likes_and_passes, [:profile_id])
    create index(:likes_and_passes, [:target_id])

    create unique_index(:likes_and_passes, [:profile_id, :target_id, :kind])
  end
end

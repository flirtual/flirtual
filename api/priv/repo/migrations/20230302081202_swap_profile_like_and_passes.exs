defmodule Flirtual.Repo.Migrations.SwapProfileLikeAndPasses do
  use Ecto.Migration

  def change do
    drop table(:user_profile_likes)
    drop table(:user_profile_passes)

    create table(:likes_and_passes, primary_key: false) do
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

      # like/pass
      add :type, :citext, null: false

      # love/friend
      add :kind, :citext, null: false

      timestamps(inserted_at: :created_at)
    end

    create index(:likes_and_passes, [:profile_id])
    create index(:likes_and_passes, [:target_id])

    create unique_index(:likes_and_passes, [:profile_id, :target_id, :type, :kind])
  end
end

defmodule Flirtual.Repo.Migrations.AddDirtyUserQueue do
  use Ecto.Migration

  def change do
    create table(:dirty_users_queue, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false

      add :user_id,
          references(:users,
            type: :uuid,
            on_delete: :delete_all
          ),
          null: false

      add :type, :citext, null: false

      timestamps(inserted_at: :created_at)
    end

    create unique_index(:dirty_users_queue, [:user_id])
  end
end

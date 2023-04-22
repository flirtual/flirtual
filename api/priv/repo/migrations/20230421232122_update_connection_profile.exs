defmodule Flirtual.Repo.Migrations.UpdateConnectionProfile do
  use Ecto.Migration

  def change do
    drop table(:connections)

    create table(:connections, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false
      add :type, :citext, null: false

      add :user_id,
          references(:users,
            type: :uuid,
            on_delete: :delete_all,
            match: :full
          ),
          null: false

      add :uid, :text
      add :display_name, :text, null: false
      add :avatar, :text

      timestamps(inserted_at: :created_at)
    end

    create unique_index(:connections, [:user_id, :type])
  end
end

defmodule Flirtual.Repo.Migrations.AddLogins do
  use Ecto.Migration

  def change do
    create table(:logins, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false

      add :session_id,
          references(:sessions,
            type: :uuid,
            on_delete: :nilify_all
          ),
          null: true

      add :user_id,
          references(:users,
            type: :uuid,
            on_delete: :delete_all
          ),
          null: true

      add :status, :text, null: false, default: "failed"
      add :ip_address, :inet
      add :ip_region, :text
      add :device_id, :text
      add :platform, :text

      timestamps(updated_at: false, inserted_at: :created_at)
    end

    create index(:logins, [:user_id])
    create index(:logins, [:user_id, :ip_region])
    create index(:logins, [:session_id])
    create index(:logins, [:created_at])

    alter table(:sessions) do
      remove :platform
    end
  end
end

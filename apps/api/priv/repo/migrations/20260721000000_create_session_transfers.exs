defmodule Flirtual.Repo.Migrations.CreateSessionTransfers do
  use Ecto.Migration

  def change do
    create table(:session_transfers, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false

      add :session_id,
          references(:sessions,
            type: :uuid,
            on_delete: :delete_all
          ),
          null: false

      add :hashed_token, :binary, null: false
      add :expire_at, :utc_datetime, null: false

      timestamps(updated_at: false, inserted_at: :created_at)
    end

    create unique_index(:session_transfers, [:hashed_token])
    create index(:session_transfers, [:expire_at])
  end
end

defmodule Flirtual.Repo.Migrations.AddPasskeys do
  use Ecto.Migration

  def change do
    create table(:user_passkeys, primary_key: false) do
      add(:id, :uuid, primary_key: true, null: false)
      add(:user_id, references(:users, type: :uuid, on_delete: :delete_all))
      add(:credential_id, :binary, null: false)
      add(:cose_key, :binary, null: false)
      add(:aaguid, :uuid, null: false)

      timestamps(updated_at: false, inserted_at: :created_at)
    end

    create(unique_index(:user_passkeys, [:credential_id]))
    create(index(:user_passkeys, [:user_id]))
  end
end

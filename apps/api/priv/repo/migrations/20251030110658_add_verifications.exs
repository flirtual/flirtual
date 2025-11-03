defmodule Flirtual.Repo.Migrations.AddVerifications do
  use Ecto.Migration

  def change do
    create table(:verifications, primary_key: false) do
      add :login_id,
          references(:logins,
            type: :uuid,
            on_delete: :delete_all
          ),
          primary_key: true,
          null: false

      add :code, :text, null: false

      timestamps(updated_at: false, inserted_at: :created_at)
    end
  end
end

defmodule Flirtual.Repo.Migrations.AddReports do
  use Ecto.Migration

  def change do
    create table(:reports, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false

      add :user_id,
          references(:users,
            type: :uuid,
            on_delete: :delete_all
          ),
          null: false

      add :target_id,
          references(:users,
            type: :uuid,
            on_delete: :delete_all
          ),
          null: false

      add :reason_id, references(:attributes, type: :uuid), null: false

      add :message, :text, null: false

      timestamps(inserted_at: :created_at)
    end
  end
end

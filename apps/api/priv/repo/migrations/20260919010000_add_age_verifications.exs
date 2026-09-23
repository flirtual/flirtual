defmodule Flirtual.Repo.Migrations.AddAgeVerifications do
  use Ecto.Migration

  def change do
    create table(:age_verifications, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false

      add :user_id, references(:users, type: :uuid, on_delete: :delete_all), null: false

      add :provider, :text, null: false
      add :status, :text, null: false

      add :session_id, :text
      add :method, :text
      add :threshold, :integer
      add :age, :integer
      add :age_lower, :integer
      add :age_upper, :integer
      add :declaration, :text
      add :region, :text
      add :evidence_id, :text
      add :error_code, :text

      add :expires_at, :utc_datetime
      add :completed_at, :utc_datetime

      timestamps(inserted_at: :created_at, type: :utc_datetime)
    end

    create index(:age_verifications, [:user_id])
    create unique_index(:age_verifications, [:session_id])
  end
end

defmodule Flirtual.Repo.Migrations.AddPhoneLogin do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :phone_number, :text
      add :phone_confirmed_at, :utc_datetime
    end

    create unique_index(:users, [:phone_number])

    create table(:phone_verifications, primary_key: false) do
      add :phone_number, :text, primary_key: true, null: false
      add :code, :text, null: false

      timestamps(updated_at: false, inserted_at: :created_at)
    end
  end
end

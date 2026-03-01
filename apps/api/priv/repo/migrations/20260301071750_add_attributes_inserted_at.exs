defmodule Flirtual.Repo.Migrations.AddAttributesInsertedAt do
  use Ecto.Migration

  def change do
    alter table(:attributes) do
      add :created_at, :utc_datetime
    end

    flush()

    execute("UPDATE attributes SET created_at = updated_at")

    alter table(:attributes) do
      modify :created_at, :utc_datetime, null: false
    end
  end
end

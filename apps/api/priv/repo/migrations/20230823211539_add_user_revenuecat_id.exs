defmodule Flirtual.Repo.Migrations.AddUserRevenuecatId do
  alias Ecto.UUID
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :revenuecat_id, :uuid
    end

    create unique_index(:users, [:revenuecat_id])

    execute("""
    UPDATE users
    SET revenuecat_id = gen_random_uuid()
    WHERE revenuecat_id IS NULL
    """)
  end
end

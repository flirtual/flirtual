defmodule Flirtual.Repo.Migrations.AddUserSlug do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :slug, :citext
    end

    create unique_index(:users, [:slug])

    execute("""
    UPDATE users
    SET slug = LEFT(username, 20)
    """)
  end
end

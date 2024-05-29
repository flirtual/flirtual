defmodule Flirtual.Repo.Migrations.AddUserUnsubscribeToken do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :unsubscribe_token, :uuid
    end

    create unique_index(:users, [:unsubscribe_token])

    execute("""
    UPDATE users
    SET unsubscribe_token = gen_random_uuid()
    WHERE unsubscribe_token IS NULL
    """)
  end
end

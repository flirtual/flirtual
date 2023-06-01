defmodule Flirtual.Repo.Migrations.AddSessionSudo do
  use Ecto.Migration

  def change do
    alter table(:sessions) do
      add :sudoer_id,
          references(:users,
            type: :uuid,
            on_delete: :nilify_all
          )
    end
  end
end

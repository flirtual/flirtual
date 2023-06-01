defmodule Flirtual.Repo.Migrations.ReportUserNullable do
  use Ecto.Migration

  def change do
    alter table(:reports) do
      remove :user_id

      add :user_id,
          references(:users,
            type: :uuid,
            on_delete: :nilify_all
          ),
          null: true
    end
  end
end

defmodule Flirtual.Repo.Migrations.ReportTargetNullable do
  use Ecto.Migration

  def change do
    drop(constraint(:reports, "reports_target_id_fkey"))

    alter table(:reports) do
      modify(:target_id, references(:users, type: :uuid, on_delete: :nilify_all), null: true)
    end
  end
end

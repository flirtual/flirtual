defmodule Flirtual.Repo.Migrations.RetainBannedHashUserIds do
  use Ecto.Migration

  def change do
    alter table(:hashes) do
      modify :user_id, :uuid, from: references(:users, type: :uuid, on_delete: :nilify_all)
    end
  end
end

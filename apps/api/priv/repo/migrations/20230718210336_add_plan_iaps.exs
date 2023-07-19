defmodule Flirtual.Repo.Migrations.AddPlanIaps do
  use Ecto.Migration

  def change do
    alter table(:plans) do
      add :apple_id, :text
      add :google_id, :text
    end

    alter table(:subscriptions) do
      add :apple_id, :text
      add :google_id, :text
    end
  end
end

defmodule Flirtual.Repo.Migrations.AddPlanRevenuecatId do
  use Ecto.Migration

  def change do
    alter table(:plans) do
      add :revenuecat_id, :string
    end
  end
end

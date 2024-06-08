defmodule Flirtual.Repo.Migrations.AddPlanChargebeeId do
  use Ecto.Migration

  def change do
    alter table(:plans) do
      add(:chargebee_id, :string)
    end
  end
end

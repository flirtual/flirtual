defmodule Flirtual.Repo.Migrations.AddUserChargebeeId do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add(:chargebee_id, :citext)
    end
  end
end

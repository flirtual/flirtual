defmodule Flirtual.Repo.Migrations.AddPushCount do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add(:push_count, :integer, default: 0)
    end
  end
end

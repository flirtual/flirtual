defmodule Flirtual.Repo.Migrations.AddUserPlatform do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add(:platforms, {:array, :text}, null: false, default: [])
    end
  end
end

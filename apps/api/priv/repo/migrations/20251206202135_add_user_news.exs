defmodule Flirtual.Repo.Migrations.AddUserNews do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add(:news, {:array, :string}, null: false, default: [])
    end
  end
end

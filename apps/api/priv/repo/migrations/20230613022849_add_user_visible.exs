defmodule Flirtual.Repo.Migrations.AddUserVisible do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :visible, :boolean, default: false
    end
  end
end

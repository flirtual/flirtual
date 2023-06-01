defmodule Flirtual.Repo.Migrations.AddAccountDeactivation do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :deactivated_at, :naive_datetime
    end
  end
end

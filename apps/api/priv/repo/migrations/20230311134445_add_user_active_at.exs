defmodule Flirtual.Repo.Migrations.AddUserActiveAt do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :active_at, :naive_datetime
    end
  end
end

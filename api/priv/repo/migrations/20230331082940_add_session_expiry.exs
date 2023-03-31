defmodule Flirtual.Repo.Migrations.AddSessionExpiry do
  use Ecto.Migration

  def change do
    alter table(:sessions) do
      add :expire_at, :naive_datetime
    end
  end
end

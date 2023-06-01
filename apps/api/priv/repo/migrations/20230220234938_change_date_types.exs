defmodule Flirtual.Repo.Migrations.ChangeDateTypes do
  use Ecto.Migration

  def change do
    alter table(:users) do
      modify :born_at, :date
    end
  end
end

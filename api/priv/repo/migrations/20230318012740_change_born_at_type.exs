defmodule Flirtual.Repo.Migrations.ChangeBornAtType do
  use Ecto.Migration

  def change do
    alter table(:users) do
      modify :born_at, :naive_datetime
    end
  end
end

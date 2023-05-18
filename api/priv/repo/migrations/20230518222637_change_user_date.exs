defmodule Flirtual.Repo.Migrations.ChangeUserDate do
  use Ecto.Migration

  def change do
    alter table(:users) do
      modify :born_at, :date
    end
  end
end

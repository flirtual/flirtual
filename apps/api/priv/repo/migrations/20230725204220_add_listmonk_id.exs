defmodule Flirtual.Repo.Migrations.AddListmonkId do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :listmonk_id, :integer
    end
  end
end

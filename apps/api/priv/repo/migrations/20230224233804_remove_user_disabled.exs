defmodule Flirtual.Repo.Migrations.RemoveUserDisabled do
  use Ecto.Migration

  def change do
    alter table(:users) do
      remove :disabled_at
    end
  end
end

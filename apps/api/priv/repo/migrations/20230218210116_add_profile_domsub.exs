defmodule Flirtual.Repo.Migrations.AddProfileDomsub do
  use Ecto.Migration

  def change do
    alter table(:user_profiles) do
      add :domsub, :citext
    end
  end
end

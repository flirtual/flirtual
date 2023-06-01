defmodule Flirtual.Repo.Migrations.MoveSeriousToProfile do
  use Ecto.Migration

  def change do
    alter table(:user_profile_preferences) do
      remove :serious
    end

    alter table(:user_profiles) do
      add :serious, :boolean
    end
  end
end

defmodule Flirtual.Repo.Migrations.AddNewToVrBoolean do
  use Ecto.Migration

  def change do
    alter table(:user_profiles) do
      add :new, :boolean
    end

    alter table(:user_profile_preferences) do
      remove :gender
      remove :kinks
    end
  end
end

defmodule Flirtual.Repo.Migrations.AddProfileGamesRel do
  use Ecto.Migration

  def change do
    alter table(:attributes) do
      add :profile_id,
          references(:user_profiles,
            type: :uuid,
            on_delete: :nilify_all
          )
    end

    alter table(:user_profiles) do
      remove :games
      remove :sexuality
      remove :platforms
      remove :interests
    end
  end
end

defmodule Flirtual.Repo.Migrations.AddThemePreference do
  use Ecto.Migration

  def change do
    alter table(:user_preferences) do
      add :theme, :citext, null: false, default: "system"
    end
  end
end

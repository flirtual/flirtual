defmodule Flirtual.Repo.Migrations.AddPreferencesLanguage do
  use Ecto.Migration

  def change do
    alter table(:users) do
      remove(:language)
    end

    alter table(:preferences) do
      add(:language, :string)
    end
  end
end

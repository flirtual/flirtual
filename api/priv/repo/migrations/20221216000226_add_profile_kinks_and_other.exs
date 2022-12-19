defmodule Flirtual.Repo.Migrations.AddProfileKinksAndOther do
  use Ecto.Migration

  def change do
    create table(:user_profile_preference_attributes, primary_key: false) do
      add :preferences_id, references(:user_profile_preferences, type: :uuid), null: false
      add :attribute_id, references(:attributes, type: :uuid), null: false
    end

    alter table(:user_preferences) do
      add :nsfw, :boolean
    end

    alter table(:user_profile_preferences) do
      add :serious, :boolean
    end
  end
end

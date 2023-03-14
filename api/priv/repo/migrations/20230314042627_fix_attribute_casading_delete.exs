defmodule Flirtual.Repo.Migrations.FixAttributeCasadingDelete do
  use Ecto.Migration

  def change do

    drop table(:user_profile_attributes)
    create table(:user_profile_attributes) do
      add :profile_id, references(:user_profiles, type: :uuid, on_delete: :delete_all), null: false
      add :attribute_id, references(:attributes, type: :uuid, on_delete: :delete_all), null: false
    end
    create unique_index(:user_profile_attributes, [:profile_id, :attribute_id])

    drop table(:user_profile_preference_attributes)
    create table(:user_profile_preference_attributes) do
      add :preferences_id, references(:user_profile_preferences, type: :uuid, on_delete: :delete_all), null: false
      add :attribute_id, references(:attributes, type: :uuid, on_delete: :delete_all), null: false
    end
    create unique_index(:user_profile_preference_attributes, [:preferences_id, :attribute_id])

  end
end

defmodule Flirtual.Repo.Migrations.FixAttributeUniqueness do
  use Ecto.Migration

  def change do
    # profile's cannot have multiple of the same attribute.

    drop table(:user_profile_attributes)

    create table(:user_profile_attributes) do
      add :profile_id, references(:user_profiles, type: :uuid), null: false
      add :attribute_id, references(:attributes, type: :uuid), null: false
    end

    create unique_index(:user_profile_attributes, [:profile_id, :attribute_id])

    # profile preferences's cannot have multiple of the same attribute.

    drop table(:user_profile_preference_attributes)

    create table(:user_profile_preference_attributes, primary_key: false) do
      add :preferences_id, references(:user_profile_preferences, type: :uuid), null: false
      add :attribute_id, references(:attributes, type: :uuid), null: false
    end

    create unique_index(:user_profile_preference_attributes, [:preferences_id, :attribute_id])
  end
end

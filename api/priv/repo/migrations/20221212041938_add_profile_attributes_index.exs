defmodule Flirtual.Repo.Migrations.AddProfileAttributesIndex do
  use Ecto.Migration

  def change do
    drop table(:user_profile_attributes)
    create table(:user_profile_attributes) do
      add :profile_id, references(:user_profiles, type: :uuid), null: false
      add :attribute_id, references(:attributes, type: :uuid), null: false
    end
  end
end

defmodule Flirtual.Repo.Migrations.AddProfileAttributes do
  use Ecto.Migration

  def change do
    alter table(:attributes) do
      remove :profile_id
    end

    create table(:user_profile_attributes, primary_key: false) do
      add :profile_id, references(:user_profiles, type: :uuid)
      add :attribute_id, references(:attributes, type: :uuid)
    end
  end
end

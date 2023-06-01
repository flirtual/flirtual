defmodule Flirtual.Repo.Migrations.AddAttributeMetadata do
  use Ecto.Migration

  def change do
    alter table(:user_profile_attributes) do
      add :metadata, :map
    end

    alter table(:user_profiles) do
      remove :gender
    end
  end
end

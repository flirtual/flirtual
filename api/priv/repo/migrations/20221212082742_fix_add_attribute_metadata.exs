defmodule Flirtual.Repo.Migrations.FixAddAttributeMetadata do
  use Ecto.Migration

  def change do
    alter table(:user_profile_attributes) do
      remove :metadata, :map
    end

    alter table(:attributes) do
      add :metadata, :map
    end
  end
end

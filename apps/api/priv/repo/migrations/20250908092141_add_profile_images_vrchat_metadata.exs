defmodule Flirtual.Repo.Migrations.AddProfileImagesVrchatMetadata do
  use Ecto.Migration

  def change do
    alter table(:profile_images) do
      add :author_id, :string
      add :author_name, :string
      add :world_id, :string
      add :world_name, :string
    end
  end
end

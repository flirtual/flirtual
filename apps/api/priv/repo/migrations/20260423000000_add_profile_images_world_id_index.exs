defmodule Flirtual.Repo.Migrations.AddProfileImagesWorldIdIndex do
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def change do
    create index(:profile_images, [:world_id], concurrently: true)
  end
end

defmodule Flirtual.Repo.Migrations.AddMissingIndexes do
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def change do
    create index(:likes_and_passes, [:target_id, :type], concurrently: true)
    create index(:likes_and_passes, [:profile_id, :type, :kind], concurrently: true)
    create index(:hashes, [:type, :hash], concurrently: true)
    create index(:profile_images, [:profile_id, :order], concurrently: true)
    create index(:profile_images, [:original_file], concurrently: true)
    create index(:oban_jobs, [:worker, :scheduled_at], concurrently: true)
    create index(:users, [:chargebee_id], concurrently: true)
    create index(:reports, [:target_id], concurrently: true)
  end
end

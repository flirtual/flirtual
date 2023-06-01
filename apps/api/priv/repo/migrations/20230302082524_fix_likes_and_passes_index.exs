defmodule Flirtual.Repo.Migrations.FixLikesAndPassesIndex do
  use Ecto.Migration

  def change do
    drop unique_index(:likes_and_passes, [:profile_id, :target_id, :type, :kind])
    create unique_index(:likes_and_passes, [:profile_id, :target_id, :kind])
  end
end

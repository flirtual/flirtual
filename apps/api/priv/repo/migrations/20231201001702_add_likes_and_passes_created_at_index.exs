defmodule Flirtual.Repo.Migrations.AddLikesAndPassesCreatedAtIndex do
  use Ecto.Migration

  def change do
    create(index(:likes_and_passes, [:created_at]))
  end
end

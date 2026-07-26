defmodule Flirtual.Repo.Migrations.AddLikesAndPassesSource do
  use Ecto.Migration

  def change do
    alter table(:likes_and_passes) do
      add :source, :citext, null: false, default: "unknown"
    end
  end
end

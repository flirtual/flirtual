defmodule Flirtual.Repo.Migrations.AddUserLikePassCounts do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :likes_count, :integer, default: 0
      add :passes_count, :integer, default: 0
    end

    flush()

    execute """
    UPDATE users
    SET likes_count = (
      SELECT COUNT(*)
      FROM likes_and_passes
      WHERE likes_and_passes.profile_id = users.id
      AND likes_and_passes.type = 'like'
    ),
    passes_count = (
      SELECT COUNT(*)
      FROM likes_and_passes
      WHERE likes_and_passes.profile_id = users.id
      AND likes_and_passes.type = 'pass'
    )
    """
  end
end

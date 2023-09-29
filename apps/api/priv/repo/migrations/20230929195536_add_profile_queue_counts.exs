defmodule Flirtual.Repo.Migrations.AddProfileQueueCounts do
  use Ecto.Migration

  def change do
    alter table(:profiles) do
      remove(:reset_love_at)
      remove(:reset_love_count)
      remove(:reset_friend_at)
      remove(:reset_friend_count)

      add(:queue_love_reset_at, :utc_datetime)
      add(:queue_love_likes, :integer, default: 0)
      add(:queue_love_passes, :integer, default: 0)
      add(:queue_friend_reset_at, :utc_datetime)
      add(:queue_friend_likes, :integer, default: 0)
      add(:queue_friend_passes, :integer, default: 0)
    end
  end
end

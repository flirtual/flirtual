defmodule Flirtual.Repo.Migrations.AddProfileResetTimes do
  use Ecto.Migration

  def change do
    alter table(:profiles) do
      remove_if_exists :reset_love_at, :utc_datetime
      remove_if_exists :reset_friend_at, :utc_datetime
      add :reset_love_at, :utc_datetime
      add :reset_love_count, :integer, default: 0
      add :reset_friend_at, :utc_datetime
      add :reset_friend_count, :integer, default: 0
    end
  end
end

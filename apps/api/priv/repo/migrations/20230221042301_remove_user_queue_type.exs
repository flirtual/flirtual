defmodule Flirtual.Repo.Migrations.RemoveUserQueueType do
  use Ecto.Migration

  def change do
    alter table(:dirty_users_queue) do
      remove :type
    end
  end
end

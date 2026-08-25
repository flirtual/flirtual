defmodule Flirtual.Repo.Migrations.DropQueuesRequestedAt do
  use Ecto.Migration

  def change do
    alter table(:queues) do
      remove :requested_at, :utc_datetime_usec
    end
  end
end

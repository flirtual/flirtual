defmodule Flirtual.Repo.Migrations.AddModeratorMessage do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :moderator_message, :string
    end
  end
end

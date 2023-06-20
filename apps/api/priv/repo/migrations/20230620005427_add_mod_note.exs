defmodule Flirtual.Repo.Migrations.AddModNote do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :moderator_note, :string
    end
  end
end

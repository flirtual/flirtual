defmodule Flirtual.Repo.Migrations.DropUserChangeQueue do
  use Ecto.Migration

  def change do
    drop(table(:user_change_queue))
  end
end

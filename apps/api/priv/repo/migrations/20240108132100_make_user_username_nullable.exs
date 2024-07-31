defmodule Flirtual.Repo.Migrations.MakeUserUsernameNullable do
  use Ecto.Migration

  def change do
    alter table(:users) do
      modify :username, :citext, null: true
    end
  end
end

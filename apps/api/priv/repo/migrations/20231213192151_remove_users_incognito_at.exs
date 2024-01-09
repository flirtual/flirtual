defmodule Flirtual.Repo.Migrations.RemoveUsersIncognitoAt do
  use Ecto.Migration

  def change do
    alter table(:users) do
      remove(:incognito_at)
    end
  end
end

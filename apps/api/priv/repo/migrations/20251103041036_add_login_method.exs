defmodule Flirtual.Repo.Migrations.AddLoginMethod do
  use Ecto.Migration

  def change do
    alter table(:logins) do
      add :method, :string
    end
  end
end

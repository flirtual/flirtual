defmodule Flirtual.Repo.Migrations.AddUserStatus do
  use Ecto.Migration

  import Ecto.Query

  alias Flirtual.{Repo, User}

  def change do
    alter table(:users) do
      add :status, :string, null: false, default: "registered"
    end

    flush()

    execute("UPDATE users SET status = 'visible' WHERE visible = true")
    execute("UPDATE users SET status = 'registered' WHERE visible = false")

    flush()

    alter table(:users) do
      remove :visible
    end
  end
end

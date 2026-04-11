defmodule Flirtual.Repo.Migrations.MakePasswordHashOptional do
  use Ecto.Migration

  def change do
    alter table(:users) do
      modify :password_hash, :string, null: true, from: {:string, null: false}
    end
  end
end

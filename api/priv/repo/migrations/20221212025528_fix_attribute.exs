defmodule Flirtual.Repo.Migrations.FixAttribute do
  use Ecto.Migration

  def change do
    drop index(:attributes, [:type])
    create index(:attributes, [:type])
  end
end

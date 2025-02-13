defmodule Flirtual.Repo.Migrations.AddProfileTimezone do
  use Ecto.Migration

  def change do
    alter table(:profiles) do
      add :timezone, :string
    end
  end
end

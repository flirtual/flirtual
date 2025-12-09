defmodule Flirtual.Repo.Migrations.AddUserGeolocation do
  use Ecto.Migration

  def change do
    alter table(:profiles) do
      add :longitude, :float
      add :latitude, :float
    end
  end
end

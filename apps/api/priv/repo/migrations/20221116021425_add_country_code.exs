defmodule Flirtual.Repo.Migrations.AddCountryCode do
  use Ecto.Migration

  def change do
    alter table(:user_profiles) do
      add :country, :citext
    end
  end
end

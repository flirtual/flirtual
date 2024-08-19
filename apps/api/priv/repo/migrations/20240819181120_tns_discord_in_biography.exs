defmodule Flirtual.Repo.Migrations.TnsDiscordInBiography do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :tns_discord_in_biography, :utc_datetime
    end
  end
end

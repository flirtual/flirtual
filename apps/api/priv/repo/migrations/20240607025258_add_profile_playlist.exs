defmodule Flirtual.Repo.Migrations.AddProfilePlaylist do
  use Ecto.Migration

  def change do
    alter table(:profiles) do
      add(:playlist, :text)
    end
  end
end

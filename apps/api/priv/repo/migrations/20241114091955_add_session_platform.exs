defmodule Flirtual.Repo.Migrations.AddSessionPlatform do
  use Ecto.Migration

  def change do
    alter table(:sessions) do
      add(:platform, :text, null: false, default: "web")
    end
  end
end

defmodule Flirtual.Repo.Migrations.AddProfileVrchatName do
  use Ecto.Migration

  def change do
    rename table(:profiles), :vrchat, to: :vrchat_name

    alter table(:profiles) do
      add :vrchat, :text
    end
  end
end

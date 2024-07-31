defmodule Flirtual.Repo.Migrations.AddLanguagesWeight do
  use Ecto.Migration

  def change do
    alter table(:profile_custom_weights) do
      add(:languages, :float, null: false, default: 1.0)
    end
  end
end

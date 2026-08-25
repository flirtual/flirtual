defmodule Flirtual.Repo.Migrations.AddPreferencesDismissed do
  use Ecto.Migration

  def change do
    alter table(:preferences) do
      add :dismissed, {:array, :string}, default: [], null: false
    end
  end
end

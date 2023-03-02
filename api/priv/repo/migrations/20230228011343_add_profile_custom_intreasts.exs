defmodule Flirtual.Repo.Migrations.AddProfileCustomIntreasts do
  use Ecto.Migration

  def change do
    alter table(:user_profiles) do
      add :custom_interests, {:array, :citext}, null: false, default: []
    end
  end
end

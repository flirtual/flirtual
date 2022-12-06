defmodule Flirtual.Repo.Migrations.AddImageOrder do
  use Ecto.Migration

  def change do
    alter table(:user_profile_images) do
      add :order, :integer
    end

    create unique_index(:user_profile_images, [:profile_id, :order])
  end
end

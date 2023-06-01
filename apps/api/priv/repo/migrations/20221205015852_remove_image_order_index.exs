defmodule Flirtual.Repo.Migrations.RemoveImageOrderIndex do
  use Ecto.Migration

  def change do
    drop index(:user_profile_images, [:profile_id, :order])
  end
end

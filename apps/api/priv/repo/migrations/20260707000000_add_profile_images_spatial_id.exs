defmodule Flirtual.Repo.Migrations.AddProfileImagesSpatialId do
  use Ecto.Migration

  def change do
    alter table(:profile_images) do
      add :spatial_id, :string
    end
  end
end

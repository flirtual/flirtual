defmodule Flirtual.Repo.Migrations.AddProfileImagesBlurHash do
  use Ecto.Migration

  def change do
    alter table(:profile_images) do
      add :blur_hash, :string
    end
  end
end

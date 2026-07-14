defmodule Flirtual.Repo.Migrations.AddProfileImagesBlurHash do
  use Ecto.Migration

  def change do
    alter table(:profile_images) do
      add_if_not_exists :blur_hash, :string
    end
  end
end

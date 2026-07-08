defmodule Flirtual.Repo.Migrations.RemoveProfileImagesScannedFailed do
  use Ecto.Migration

  def change do
    alter table(:profile_images) do
      remove :scanned, :boolean, default: false
      remove :failed, :boolean, default: false
    end
  end
end

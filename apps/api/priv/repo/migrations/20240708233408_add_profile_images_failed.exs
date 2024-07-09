defmodule Flirtual.Repo.Migrations.AddProfileImagesFailed do
  use Ecto.Migration

  def change do
    alter table(:profile_images) do
      add(:failed, :boolean, default: false, null: false)
    end
  end
end

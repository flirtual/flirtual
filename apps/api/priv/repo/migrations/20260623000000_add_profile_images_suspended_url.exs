defmodule Flirtual.Repo.Migrations.AddProfileImagesSuspendedUrl do
  use Ecto.Migration

  def change do
    alter table(:profile_images) do
      add(:suspended_url, :string)
    end
  end
end

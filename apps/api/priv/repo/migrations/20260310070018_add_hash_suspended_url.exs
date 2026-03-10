defmodule Flirtual.Repo.Migrations.AddHashSuspendedUrl do
  use Ecto.Migration

  def change do
    alter table(:hashes) do
      add(:suspended_url, :string)
    end
  end
end

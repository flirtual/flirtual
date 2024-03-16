defmodule Flirtual.Repo.Migrations.AddFacetimeConnection do
  use Ecto.Migration

  def change do
    alter table(:profiles) do
      add(:facetime, :text)
    end
  end
end

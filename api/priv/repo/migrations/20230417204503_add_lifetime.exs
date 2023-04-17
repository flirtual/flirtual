defmodule Flirtual.Repo.Migrations.AddLifetime do
  use Ecto.Migration

  def change do
    alter table(:plans) do
      add :recurring, :boolean
      add :purchasable, :boolean
      modify :price_id, :string, null: true
      remove :features
    end
  end
end

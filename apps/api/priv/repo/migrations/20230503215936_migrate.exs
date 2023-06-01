defmodule Flirtual.Repo.Migrations.Migrate do
  use Ecto.Migration

  def change do
    alter table(:subscriptions) do
      modify :stripe_id, :text, null: true
    end
  end
end

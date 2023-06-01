defmodule Flirtual.Repo.Migrations.StripePlans do
  use Ecto.Migration

  def change do
    create table(:plans, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false

      add :name, :text, null: false
      add :features, {:array, :citext}, null: false, default: []

      add :product_id, :citext, null: false
      add :price_id, :citext, null: false

      timestamps(inserted_at: :created_at, updated_at: false)
    end

    alter table(:subscriptions) do
      remove :stripe_id
      remove :type

      add :plan_id,
          references(:plans,
            type: :uuid,
            on_delete: :restrict,
            match: :full
          ),
          null: false
    end
  end
end

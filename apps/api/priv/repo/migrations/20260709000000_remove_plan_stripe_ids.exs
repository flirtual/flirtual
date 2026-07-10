defmodule Flirtual.Repo.Migrations.RemovePlanStripeIds do
  use Ecto.Migration

  def change do
    alter table(:plans) do
      remove :product_id, :citext
      remove :price_id, :string
    end
  end
end

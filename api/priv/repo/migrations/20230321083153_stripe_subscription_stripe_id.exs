defmodule Flirtual.Repo.Migrations.StripeSubscriptionStripeId do
  use Ecto.Migration

  def change do
    alter table(:subscriptions) do
      add :stripe_id, :text, null: false
    end
  end
end

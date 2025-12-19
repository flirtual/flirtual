defmodule Flirtual.Repo.Migrations.RemoveSubscriptionStripeId do
  use Ecto.Migration

  def change do
    alter table(:subscriptions) do
      remove :stripe_id, :string
    end
  end
end

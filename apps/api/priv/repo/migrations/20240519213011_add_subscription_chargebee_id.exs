defmodule Flirtual.Repo.Migrations.AddSubscriptionChargebeeId do
  use Ecto.Migration

  def change do
    alter table(:subscriptions) do
      add(:chargebee_id, :citext)
    end
  end
end

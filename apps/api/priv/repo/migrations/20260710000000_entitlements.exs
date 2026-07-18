defmodule Flirtual.Repo.Migrations.Entitlements do
  use Ecto.Migration

  def change do
    rename(table(:subscriptions), to: table(:entitlements))

    alter table(:entitlements) do
      add(:kind, :string)
      add(:store, :string)
      add(:entitled_until, :utc_datetime)
      add(:renews, :boolean)
      add(:renewal_pending, :boolean)
      add(:quantity, :integer)
      add(:reconciled_at, :utc_datetime)
    end

    # Cancelled rows lapsed at their cancellation time. Active rows are left
    # perpetual until their first reconcile fills in the provider's real
    # paid-through date.
    execute(
      """
      UPDATE entitlements SET
        kind = CASE WHEN plans.recurring THEN 'subscription' ELSE 'one_time' END,
        store = CASE
          WHEN entitlements.apple_id IS NOT NULL THEN 'app_store'
          WHEN entitlements.google_id IS NOT NULL THEN 'play_store'
          -- Stripe payment intents recorded before the Chargebee migration;
          -- Chargebee has never heard of them.
          WHEN entitlements.chargebee_id LIKE 'pi\\_%' THEN 'stripe'
          WHEN entitlements.chargebee_id IS NOT NULL THEN 'chargebee'
          -- subscriptions.stripe_id was dropped long ago, so a Stripe-era
          -- purchase is recognizable only by its owner's Stripe customer.
          WHEN users.stripe_id IS NOT NULL
            AND plans.id != '7bd2c5d3-d5e2-4188-af26-b26f64f9101f' THEN 'stripe'
          ELSE 'promotional'
        END,
        entitled_until = entitlements.cancelled_at,
        renews = entitlements.cancelled_at IS NULL AND plans.recurring
      FROM plans, users
      WHERE plans.id = entitlements.plan_id AND users.id = entitlements.user_id
      """,
      ""
    )

    alter table(:entitlements) do
      add(:store_id, :string)
    end

    execute(
      """
      UPDATE entitlements SET store_id = CASE entitlements.store
        WHEN 'app_store' THEN entitlements.apple_id
        WHEN 'play_store' THEN entitlements.google_id
        WHEN 'chargebee' THEN entitlements.chargebee_id
        WHEN 'stripe' THEN coalesce(entitlements.chargebee_id, users.stripe_id)
      END
      FROM users WHERE users.id = entitlements.user_id
      """,
      ""
    )

    alter table(:entitlements) do
      modify(:kind, :string, null: false, from: {:string, null: true})
      modify(:store, :string, null: false, from: {:string, null: true})
      remove(:cancelled_at, :utc_datetime)
      remove(:chargebee_id, :string)
      remove(:google_id, :string)
      remove(:apple_id, :string)
    end

    drop(index(:entitlements, [:user_id], name: :subscriptions_user_id_index))
    create(unique_index(:entitlements, [:user_id, :store, :kind]))
    create(index(:entitlements, [:entitled_until]))
    create(index(:entitlements, [:store_id]))

    alter table(:plans) do
      add(:product, :string)
    end

    execute("UPDATE plans SET product = 'premium'", "")

    alter table(:plans) do
      modify(:product, :string, null: false, from: {:string, null: true})
    end
  end
end

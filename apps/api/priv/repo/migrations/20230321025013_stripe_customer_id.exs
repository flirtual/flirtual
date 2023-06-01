defmodule Flirtual.Repo.Migrations.StripeCustomerId do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :stripe_id, :citext
    end
  end
end

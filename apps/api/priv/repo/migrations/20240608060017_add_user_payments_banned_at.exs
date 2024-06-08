defmodule Flirtual.Repo.Migrations.AddUserPaymentsBannedAt do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add(:payments_banned_at, :utc_datetime)
    end
  end
end

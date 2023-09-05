defmodule Flirtual.Repo.Migrations.AddUserApnsFcmTokens do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add(:apns_token, :string)
      add(:fcm_token, :string)
    end
  end
end

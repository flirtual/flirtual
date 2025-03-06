defmodule Flirtual.Repo.Migrations.SwitchUserApnsFcmTokensToArrays do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add(:apns_tokens, {:array, :string}, null: false, default: [])
      add(:fcm_tokens, {:array, :string}, null: false, default: [])
    end

    flush()

    execute("""
    UPDATE users
    SET apns_tokens = ARRAY_REMOVE(ARRAY[apns_token], NULL),
        fcm_tokens = ARRAY_REMOVE(ARRAY[fcm_token], NULL)
    """)

    alter table(:users) do
      remove(:apns_token)
      remove(:fcm_token)
    end
  end
end

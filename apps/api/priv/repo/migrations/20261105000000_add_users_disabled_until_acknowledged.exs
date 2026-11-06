defmodule Flirtual.Repo.Migrations.AddUsersDisabledUntilAcknowledged do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add(:disabled_until_acknowledged, :boolean, null: false, default: false)
    end

    create constraint(:users, :disabled_until_acknowledged_requires_warning,
             check: "not disabled_until_acknowledged or moderator_message is not null"
           )
  end
end

defmodule Flirtual.Repo.Migrations.AddNotificationPreferenceReminders do
  use Ecto.Migration

  def change do
    alter table(:preferences_email_notifications) do
      add(:reminders, :boolean, null: false, default: true)
    end
  end
end

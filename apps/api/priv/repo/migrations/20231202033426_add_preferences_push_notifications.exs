defmodule Flirtual.Repo.Migrations.AddPreferencesPushNotifications do
  use Ecto.Migration

  def change do
    create table(:preferences_push_notifications, primary_key: false) do
      add(
        :preferences_id,
        references(:preferences,
          type: :uuid,
          on_delete: :delete_all,
          column: :user_id,
          match: :full
        ),
        null: false,
        primary_key: true
      )

      add(:matches, :boolean, null: false, default: true)
      add(:messages, :boolean, null: false, default: true)
      add(:likes, :boolean, null: false, default: true)
      add(:reminders, :boolean, null: false, default: true)
      add(:newsletter, :boolean, null: false, default: true)
    end

    execute("""
    INSERT INTO preferences_push_notifications (preferences_id, matches, messages, likes, reminders, newsletter)
    SELECT
        users.id,
        true,
        true,
        true,
        true,
        COALESCE(pen.newsletter, true)
    FROM
        users
    LEFT JOIN
        preferences_email_notifications pen ON pen.preferences_id = users.id
    """)
  end
end

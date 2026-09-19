defmodule Flirtual.Repo.Migrations.AddModerationEvents do
  use Ecto.Migration

  def change do
    create table(:moderation_events, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false

      add :type, :text, null: false

      add :user_id, :uuid
      add :moderator_id, :uuid

      add :reason_id, references(:attributes, type: :uuid, on_delete: :nilify_all)

      add :message, :text
      add :automatic, :boolean, null: false, default: false
      add :details, :map, null: false, default: fragment("'{}'::jsonb")

      add :reviewed_at, :utc_datetime
      add :reviewed_by, :uuid

      add :revoked_at, :utc_datetime
      add :revoked_by, :uuid

      add :acknowledged_at, :utc_datetime

      timestamps(inserted_at: :created_at, type: :utc_datetime)
    end

    create index(:moderation_events, [:user_id, :type, "created_at DESC"],
             name: :moderation_events_user_type_created_at_index
           )

    create index(:moderation_events, [:type, "created_at DESC"],
             name: :moderation_events_type_created_at_index
           )

    create index(:moderation_events, [:moderator_id])

    create index(:moderation_events, [:user_id, :type],
             where: "revoked_at IS NULL",
             name: :moderation_events_active_index
           )
  end
end

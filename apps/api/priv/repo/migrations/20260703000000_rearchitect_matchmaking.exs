defmodule Flirtual.Repo.Migrations.RearchitectMatchmaking do
  use Ecto.Migration

  def up do
    drop table(:prospects)

    create table(:prospects, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false

      add :profile_id,
          references(:profiles,
            type: :uuid,
            on_delete: :delete_all,
            column: :user_id,
            match: :full
          ),
          null: false

      add :target_id,
          references(:profiles,
            type: :uuid,
            on_delete: :delete_all,
            column: :user_id,
            match: :full
          ),
          null: false

      add :kind, :citext, null: false
      add :position, :integer, null: false
      add :score, :float, null: false, default: 0.0
      add :fallback, :boolean, null: false, default: false
      add :completed_at, :utc_datetime_usec

      timestamps(inserted_at: :created_at, updated_at: false)
    end

    create index(:prospects, [:target_id])
    create unique_index(:prospects, [:profile_id, :target_id, :kind])

    create index(:prospects, [:profile_id, :kind, :position],
             where: "completed_at IS NULL",
             name: :prospects_uncompleted_position_index
           )

    create index(:prospects, [:profile_id, :kind, :completed_at],
             where: "completed_at IS NOT NULL",
             name: :prospects_completed_at_index
           )

    create table(:queues, primary_key: false) do
      add :profile_id,
          references(:profiles,
            type: :uuid,
            on_delete: :delete_all,
            column: :user_id,
            match: :full
          ),
          primary_key: true,
          null: false

      add :kind, :citext, primary_key: true, null: false
      add :requested_at, :utc_datetime_usec
      add :computed_at, :utc_datetime_usec
      add :fallback_active, :boolean, null: false, default: false
      add :fallback_notified_at, :utc_datetime
      add :filters_updated_at, :utc_datetime
      add :exhausted_at, :utc_datetime
      add :undone, :boolean, null: false, default: false
      add :likes_count, :integer, null: false, default: 0
      add :passes_count, :integer, null: false, default: 0
      add :reset_at, :utc_datetime
    end

    drop table(:profile_custom_filters)

    create table(:profile_advanced_filters, primary_key: false) do
      add :profile_id,
          references(:profiles,
            type: :uuid,
            on_delete: :delete_all,
            column: :user_id,
            match: :full
          ),
          null: false

      add :kind, :citext, null: false
      add :category, :citext, null: false

      add :attribute_id,
          references(:attributes, type: :uuid, on_delete: :delete_all),
          null: true

      add :value, :citext, null: true

      timestamps(inserted_at: :created_at, updated_at: false)
    end

    create constraint(:profile_advanced_filters, :attribute_or_value,
             check: "(attribute_id IS NULL) != (value IS NULL)"
           )

    create unique_index(
             :profile_advanced_filters,
             ["profile_id", "kind", "category", "COALESCE(attribute_id::text, value::text)"],
             name: :profile_advanced_filters_unique_index
           )

    create index(:profile_advanced_filters, [:profile_id])

    alter table(:profiles) do
      remove :queue_love_reset_at
      remove :queue_love_likes
      remove :queue_love_passes
      remove :queue_friend_reset_at
      remove :queue_friend_likes
      remove :queue_friend_passes
    end

    create index(:likes_and_passes, [:profile_id, :created_at])
  end
end

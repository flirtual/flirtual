defmodule Flirtual.Repo.Migrations.SwitchToComsitieKeys do
  use Ecto.Migration

  def change do
    execute "TRUNCATE users CASCADE"

    drop table(:user_profiles), mode: :cascade

    create table(:profiles, primary_key: false) do
      add :user_id,
          references(:users,
            type: :uuid,
            on_delete: :delete_all
          ),
          null: false,
          primary_key: true

      add :display_name, :text
      add :biography, :text
      add :country, :citext
      add :new, :boolean
      add :serious, :boolean
      add :domsub, :citext
      add :monopoly, :citext
      add :custom_interests, {:array, :citext}, null: false, default: []

      add :question0, :boolean
      add :question1, :boolean
      add :question2, :boolean
      add :question3, :boolean
      add :question4, :boolean
      add :question5, :boolean
      add :question6, :boolean
      add :question7, :boolean
      add :question8, :boolean

      timestamps(inserted_at: false)
    end

    drop table(:user_profile_attributes), mode: :cascade

    create table(:profile_attributes, primary_key: false) do
      add :profile_id,
          references(:profiles,
            type: :uuid,
            column: :user_id,
            on_delete: :delete_all,
            match: :full
          ),
          null: false,
          primary_key: true

      add :attribute_id,
          references(:attributes, type: :uuid, on_delete: :delete_all, match: :full),
          null: false,
          primary_key: true
    end

    drop table(:user_profile_preferences), mode: :cascade

    create table(:profile_preferences, primary_key: false) do
      add :profile_id,
          references(:profiles,
            type: :uuid,
            on_delete: :delete_all,
            column: :user_id,
            match: :full
          ),
          null: false,
          primary_key: true

      add :agemin, :integer
      add :agemax, :integer
    end

    drop table(:user_profile_preference_attributes), mode: :cascade

    create table(:profile_preference_attributes, primary_key: false) do
      add :preferences_id,
          references(:profile_preferences,
            type: :uuid,
            column: :profile_id,
            on_delete: :delete_all,
            match: :full
          ),
          null: false,
          primary_key: true

      add :attribute_id,
          references(:attributes, type: :uuid, on_delete: :delete_all, match: :full),
          null: false,
          primary_key: true
    end

    drop table(:user_profile_custom_weights), mode: :cascade

    create table(:profile_custom_weights, primary_key: false) do
      add :profile_id,
          references(:profiles,
            type: :uuid,
            on_delete: :delete_all,
            column: :user_id,
            match: :full
          ),
          null: false,
          primary_key: true

      add :country, :integer, null: false, default: 1
      add :monopoly, :integer, null: false, default: 1
      add :games, :integer, null: false, default: 1
      add :default_interests, :integer, null: false, default: 1
      add :custom_interests, :integer, null: false, default: 1
      add :personality, :integer, null: false, default: 1
      add :serious, :integer, null: false, default: 1
      add :domsub, :integer, null: false, default: 1
      add :kinks, :integer, null: false, default: 1
      add :likes, :integer, null: false, default: 1
    end

    drop table(:user_subscriptions), mode: :cascade

    create table(:subscriptions, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false

      add :user_id,
          references(:users,
            type: :uuid,
            on_delete: :delete_all,
            match: :full
          ),
          null: false

      add :type, :text, null: false
      add :stripe_id, :text, null: false
      add :cancelled_at, :naive_datetime

      timestamps(inserted_at: :created_at)
    end

    create unique_index(:subscriptions, [:user_id])

    drop table(:user_connections), mode: :cascade

    create table(:connections, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false

      add :user_id,
          references(:users,
            type: :uuid,
            on_delete: :delete_all,
            match: :full
          ),
          null: false,
          primary_key: true

      add :type, :citext, null: false, primary_key: true
      add :external_id, :text, null: false

      timestamps(inserted_at: :created_at)
    end

    drop table(:user_preferences), mode: :cascade

    create table(:preferences, primary_key: false) do
      add :user_id,
          references(:users,
            type: :uuid,
            on_delete: :delete_all,
            match: :full
          ),
          null: false,
          primary_key: true

      add :nsfw, :boolean
      add :theme, :citext, null: false, default: "system"
    end

    drop table(:user_preference_email_notifications), mode: :cascade

    create table(:preferences_email_notifications, primary_key: false) do
      add :preferences_id,
          references(:preferences,
            type: :uuid,
            on_delete: :delete_all,
            column: :user_id,
            match: :full
          ),
          null: false,
          primary_key: true

      add :matches, :boolean, null: false, default: true
      add :messages, :boolean, null: false, default: true
      add :likes, :boolean, null: false, default: true
      add :newsletter, :boolean, null: false, default: true
    end

    drop table(:user_preference_privacy), mode: :cascade

    create table(:preferences_privacy, primary_key: false) do
      add :preferences_id,
          references(:preferences,
            type: :uuid,
            on_delete: :delete_all,
            column: :user_id,
            match: :full
          ),
          null: false,
          primary_key: true

      add :analytics, :boolean, null: false, default: true
      add :personality, :text, null: false, default: "everyone"
      add :connections, :text, null: false, default: "everyone"
      add :sexuality, :text, null: false, default: "everyone"
      add :country, :text, null: false, default: "everyone"
      add :kinks, :text, null: false, default: "everyone"
    end

    drop table(:user_profile_images), mode: :cascade

    create table(:profile_images, primary_key: false) do
      add :profile_id,
          references(:profiles,
            type: :uuid,
            on_delete: :delete_all,
            column: :user_id,
            match: :full
          ),
          null: false,
          primary_key: true

      add :external_id, :text, null: false
      add :scanned, :boolean, null: false, default: false
      add :order, :integer

      timestamps(inserted_at: :created_at)
    end

    drop table(:user_profile_blocks), mode: :cascade

    create table(:blocks, primary_key: false) do
      add :profile_id,
          references(:users,
            type: :uuid,
            on_delete: :delete_all,
            match: :full
          ),
          null: false,
          primary_key: true

      add :target_id,
          references(:users,
            type: :uuid,
            on_delete: :delete_all,
            match: :full
          ),
          null: false,
          primary_key: true

      timestamps(updated_at: false, inserted_at: :created_at)
    end

    drop table(:dirty_users_queue), mode: :cascade

    create table(:user_change_queue, primary_key: false) do
      add :user_id,
          references(:users,
            type: :uuid,
            on_delete: :delete_all,
            match: :full
          ),
          null: false,
          primary_key: true

      add :type, :citext, null: false

      timestamps(inserted_at: :created_at)
    end
  end
end

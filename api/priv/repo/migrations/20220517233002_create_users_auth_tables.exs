defmodule Flirtual.Repo.Migrations.CreateUsersAuthTables do
  use Ecto.Migration

  def change do
    execute "CREATE EXTENSION IF NOT EXISTS citext", ""

    create table(:users, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false
      add :email, :citext, null: false
      add :username, :text, null: false
      add :password_hash, :text, null: false
      add :talkjs_signature, :text
      add :language, :citext, [null: false, default: "en"]

      add :tags, {:array, :citext}, [null: false, default: []]

      add :born_at, :naive_datetime
      add :email_confirmed_at, :naive_datetime
      add :banned_at, :naive_datetime
      add :shadowbanned_at, :naive_datetime
      add :disabled_at, :naive_datetime
      add :incognito_at, :naive_datetime

      timestamps()
    end

    create unique_index(:users, [:email])
    create unique_index(:users, [:username])

    create table(:user_connections, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false
      add :user_id, references(:users, [
        type: :uuid,
        on_delete: :delete_all
      ]), null: false

      add :type, :citext, null: false
      add :external_id, :text, null: false

      timestamps()
    end

    create index(:user_connections, [:user_id])
    create unique_index(:user_connections, [:user_id, :type])
    # create unique_index(:user_connections, [:user_id, :external_id])

    create table(:user_preferences, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false
      add :user_id, references(:users, [
        type: :uuid,
        on_delete: :delete_all
      ]), null: false
    end

    create unique_index(:user_preferences, [:user_id])

    create table(:user_preference_email_notifications, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false
      add :user_preference_id, references(:user_preferences, [
        type: :uuid,
        on_delete: :delete_all
      ]), null: false

      add :matches, :boolean, [null: false, default: true]
      add :messages, :boolean, [null: false, default: true]
      add :likes, :boolean, [null: false, default: true]
      add :newsletter, :boolean, [null: false, default: true]
    end

    create unique_index(:user_preference_email_notifications, [:user_preference_id])

    create table(:user_preference_privacy, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false
      add :user_preference_id, references(:user_preferences, [
        type: :uuid,
        on_delete: :delete_all
      ]), null: false

      add :analytics, :boolean, [null: false, default: true]
      add :personality, :text, [null: false, default: "everyone"]
      add :connections, :text, [null: false, default: "everyone"]
      add :sexuality, :text, [null: false, default: "everyone"]
      add :country, :text, [null: false, default: "everyone"]
      add :kinks, :text, [null: false, default: "everyone"]
    end

    create unique_index(:user_preference_privacy, [:user_preference_id])

    create table(:user_subscriptions, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false
      add :user_id, references(:users, [
        type: :uuid,
        on_delete: :delete_all
      ]), null: false

      add :type, :text, null: false
      add :stripe_id, :text, null: false
      add :cancelled_at, :naive_datetime

      timestamps()
    end

    create unique_index(:user_subscriptions, [:user_id])

    create table(:user_profiles, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false
      add :user_id, references(:users, [
        type: :uuid,
        on_delete: :delete_all
      ]), null: false

      add :display_name, :text
      add :biography, :text
      add :gender, {:array, :citext}, [null: false, default: []]
      add :sexuality, {:array, :citext}, [null: false, default: []]
      add :games, {:array, :citext}, [null: false, default: []]
      add :languages, {:array, :citext}, [null: false, default: []]
      add :platforms, {:array, :citext}, [null: false, default: []]
      add :interests, {:array, :citext}, [null: false, default: []]
    end

    create unique_index(:user_profiles, [:user_id])

    create table(:user_profile_images, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false
      add :user_profile_id, references(:user_profiles, [
        type: :uuid,
        on_delete: :delete_all
      ]), null: false

      add :external_id, :text, null: false
      add :scanned, :boolean, [null: false, default: false]
    end

    create index(:user_profile_images, [:user_profile_id])
    create index(:user_profile_images, [:external_id])

    create table(:user_profile_likes, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false
      add :user_id, references(:users, [
        type: :uuid,
        on_delete: :delete_all
      ]), null: false
      add :target_id, references(:users, [
        type: :uuid,
        on_delete: :delete_all
      ]), null: false

      add :type, :text, null: false
      timestamps(updated_at: false)
    end

    create index(:user_profile_likes, [:user_id])
    create index(:user_profile_likes, [:target_id])
    create unique_index(:user_profile_likes, [:user_id, :target_id])
    create unique_index(:user_profile_likes, [:target_id, :user_id])

    create table(:user_profile_preferences, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false
      add :user_profile_id, references(:user_profiles, [
        type: :uuid,
        on_delete: :delete_all
      ]), null: false

      add :agemin, :integer
      add :agemax, :integer
      add :gender, {:array, :citext}, [null: false, default: []]
      add :kinks, {:array, :citext}, [null: false, default: []]
    end

    create unique_index(:user_profile_preferences, [:user_profile_id])

    create table(:user_profile_custom_weights, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false
      add :user_profile_id, references(:user_profiles, [
        type: :uuid,
        on_delete: :delete_all
      ]), null: false

      add :country, :integer, [null: false, default: 1]
      add :monopoly, :integer, [null: false, default: 1]
      add :games, :integer, [null: false, default: 1]
      add :default_interests, :integer, [null: false, default: 1]
      add :custom_interests, :integer, [null: false, default: 1]
      add :personality, :integer, [null: false, default: 1]
      add :serious, :integer, [null: false, default: 1]
      add :domsub, :integer, [null: false, default: 1]
      add :kinks, :integer, [null: false, default: 1]
      add :likes, :integer, [null: false, default: 1]
    end

    create unique_index(:user_profile_custom_weights, [:user_profile_id])

  end
end

defmodule Flirtual.Repo.Migrations.AddChat do
  use Ecto.Migration

  def change do
    create table(:conversations, primary_key: false) do
      add(:id, :text, primary_key: true)
      add(:kind, :text, null: false)
      add(:seq, :bigint, null: false, default: 0)
      add(:last_message_id, :uuid)

      timestamps(type: :utc_datetime_usec, inserted_at: :created_at)
    end

    create table(:conversation_participants, primary_key: false) do
      add(
        :conversation_id,
        references(:conversations, type: :text, on_delete: :delete_all),
        primary_key: true
      )

      add(:user_id, references(:users, type: :uuid, on_delete: :delete_all), primary_key: true)
      add(:last_read_seq, :bigint, null: false, default: 0)
      add(:unread_count, :integer, null: false, default: 0)
      add(:emailed_seq, :bigint, null: false, default: 0)
      add(:active_at, :utc_datetime_usec, null: false)
      add(:left_at, :utc_datetime_usec)

      timestamps(type: :utc_datetime_usec, inserted_at: :created_at, updated_at: false)
    end

    create index(:conversation_participants, [:user_id, "active_at DESC", "conversation_id DESC"],
             where: "left_at IS NULL",
             name: :conversation_participants_user_active_index
           )

    create index(:conversation_participants, [:user_id],
             where: "left_at IS NULL AND unread_count > 0",
             name: :conversation_participants_user_unread_index
           )

    create index(:conversation_participants, [:user_id])

    create table(:messages, primary_key: false) do
      add(:id, :uuid, primary_key: true)

      add(
        :conversation_id,
        references(:conversations, type: :text, on_delete: :delete_all),
        null: false
      )

      add(:sender_id, references(:users, type: :uuid, on_delete: :nilify_all))
      add(:seq, :bigint, null: false)
      add(:version, :bigint, null: false)
      add(:system, :boolean, null: false, default: false)
      add(:kind, :text)
      add(:text, :text, null: false)
      add(:reply_to_id, references(:messages, type: :uuid, on_delete: :nilify_all))
      add(:gif_width, :integer)
      add(:gif_height, :integer)
      add(:client_id, :uuid)
      add(:edited_at, :utc_datetime_usec)
      add(:deleted_at, :utc_datetime_usec)

      timestamps(type: :utc_datetime_usec, inserted_at: :created_at, updated_at: false)
    end

    create unique_index(:messages, [:conversation_id, :seq])
    create index(:messages, [:conversation_id, :version])
    create index(:messages, [:reply_to_id], where: "reply_to_id IS NOT NULL")
    create index(:messages, [:sender_id])

    create unique_index(:messages, [:conversation_id, :sender_id, :client_id],
             where: "client_id IS NOT NULL"
           )

    create table(:message_reactions, primary_key: false) do
      add(:message_id, references(:messages, type: :uuid, on_delete: :delete_all),
        primary_key: true
      )

      add(:user_id, references(:users, type: :uuid, on_delete: :delete_all), primary_key: true)
      add(:emoji, :text, primary_key: true)

      timestamps(type: :utc_datetime_usec, inserted_at: :created_at, updated_at: false)
    end

    create index(:message_reactions, [:user_id])
  end
end

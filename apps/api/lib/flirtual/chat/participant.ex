defmodule Flirtual.Chat.Participant do
  use Flirtual.Schema, primary_key: false

  alias Flirtual.Chat.Conversation
  alias Flirtual.User

  @timestamps_opts [type: :utc_datetime_usec, inserted_at: :created_at]

  schema "conversation_participants" do
    belongs_to(:conversation, Conversation, type: :string, primary_key: true)
    belongs_to(:user, User, primary_key: true)

    field(:last_read_seq, :integer, default: 0)
    field(:unread_count, :integer, default: 0)
    field(:emailed_seq, :integer, default: 0)
    field(:active_at, :utc_datetime_usec)
    field(:left_at, :utc_datetime_usec)

    timestamps(updated_at: false)
  end
end

defmodule Flirtual.Chat.Reaction do
  use Flirtual.Schema, primary_key: false

  alias Flirtual.Chat.Message
  alias Flirtual.User

  @timestamps_opts [type: :utc_datetime_usec, inserted_at: :created_at]

  schema "message_reactions" do
    belongs_to(:message, Message, primary_key: true)
    belongs_to(:user, User, primary_key: true)

    field(:emoji, :string, primary_key: true)

    timestamps(updated_at: false)
  end
end

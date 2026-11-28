defmodule Flirtual.Chat.Conversation do
  use Flirtual.Schema

  alias Flirtual.Chat.{Message, Participant}

  @primary_key {:id, :string, autogenerate: false}
  @timestamps_opts [type: :utc_datetime_usec, inserted_at: :created_at]

  schema "conversations" do
    field(:kind, Ecto.Enum, values: [:love, :friend])
    field(:seq, :integer, default: 0)

    belongs_to(:last_message, Message)
    has_many(:participants, Participant)

    timestamps()
  end
end

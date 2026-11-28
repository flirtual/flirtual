defmodule Flirtual.ObanWorkers.ChatEmail do
  use Oban.Worker,
    queue: :notifications,
    priority: 2,
    max_attempts: 3,
    unique: [
      period: :infinity,
      states: [:available, :scheduled, :retryable],
      keys: [:conversation_id, :recipient_id]
    ],
    replace: [scheduled: [:scheduled_at]]

  import Ecto.Query

  alias Flirtual.Chat
  alias Flirtual.Chat.{Conversation, Participant}
  alias Flirtual.{Repo, User, Users}

  @delay 15

  def delay, do: @delay

  @impl Oban.Worker
  def perform(%Oban.Job{
        args: %{"conversation_id" => conversation_id, "recipient_id" => recipient_id}
      }) do
    with %Participant{left_at: nil} = participant <-
           Participant
           |> where(conversation_id: ^conversation_id, user_id: ^recipient_id)
           |> Repo.one(),
         true <- participant.unread_count > 0,
         true <- participant.last_read_seq >= participant.emailed_seq,
         %Conversation{last_message: %{sender_id: sender_id}} = conversation
         when is_binary(sender_id) and sender_id != recipient_id <-
           Chat.get_conversation(conversation_id),
         %User{banned_at: nil, deactivated_at: nil, email: email} = recipient
         when is_binary(email) <-
           Users.get(recipient_id, [:profile, preferences: [:email_notifications]]),
         true <- recipient.preferences.email_notifications.messages,
         {:ok, _} <- Chat.access(recipient, conversation_id),
         %User{} = sender <- Users.get(sender_id, Chat.sender_assoc()),
         {:ok, _} <-
           User.Email.deliver(recipient, :new_message,
             conversation_id: conversation_id,
             sender: sender
           ) do
      Participant
      |> where(conversation_id: ^conversation_id, user_id: ^recipient_id)
      |> Repo.update_all(set: [emailed_seq: conversation.seq])

      :ok
    else
      {:error, reason} -> {:error, reason}
      _ -> :ok
    end
  end
end

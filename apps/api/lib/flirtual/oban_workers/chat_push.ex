defmodule Flirtual.ObanWorkers.ChatPush do
  use Oban.Worker, queue: :notifications, priority: 0, max_attempts: 3

  import Ecto.Query

  alias Flirtual.Chat
  alias Flirtual.Chat.{Message, Participant}
  alias Flirtual.{PushNotification, Repo, User, Users}

  @impl Oban.Worker
  def perform(%Oban.Job{
        args: %{"message_id" => message_id, "recipient_id" => recipient_id} = args
      }) do
    with %Message{deleted_at: nil, sender_id: sender_id} = message when is_binary(sender_id) <-
           Repo.get(Message, message_id),
         %Participant{left_at: nil} = participant <-
           Participant
           |> where(conversation_id: ^message.conversation_id, user_id: ^recipient_id)
           |> Repo.one(),
         true <- participant.last_read_seq < message.seq,
         %User{banned_at: nil, deactivated_at: nil} = recipient <-
           Users.get(recipient_id, preferences: [:push_notifications]),
         true <- recipient.preferences.push_notifications.messages,
         true <- recipient.apns_tokens != [] or recipient.fcm_tokens != [],
         {:ok, _} <- Chat.access(recipient, message.conversation_id),
         %User{} = sender <- Users.get(sender_id, Chat.sender_assoc()) do
      PushNotification.send_message(recipient, sender, message, args["gif_preview"])
    else
      _ -> :ok
    end
  end
end

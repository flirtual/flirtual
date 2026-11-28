defmodule Flirtual.Chat do
  use Flirtual.Logger, :chat

  import Ecto.Query

  alias Flirtual.Chat.{Conversation, Links, Message, Participant, Reaction}
  alias Flirtual.{ObanWorkers, Repo, Talkjs, User, Users}
  alias Flirtual.User.Profile.Block

  @match_message "It's a match!"
  @page_size 30
  @max_page_size 100
  @sync_limit 200
  @max_reactions 20
  @unread_limit 100

  def enabled?, do: not Talkjs.configured?()

  def match_message, do: @match_message

  def sender_assoc,
    do: [profile: [images: from(image in User.Profile.Image, order_by: image.order)]]

  def conversation_id(user_id, target_id), do: Talkjs.new_conversation_id(user_id, target_id)

  def conversation_topic(conversation_id), do: "conversation:" <> conversation_id
  def viewing_topic(conversation_id), do: "viewing:" <> conversation_id
  def user_topic(user_id), do: "user:" <> user_id
  def socket_id(user_id), do: "chat:" <> user_id

  def get_conversation(conversation_id, preloads \\ [:participants, :last_message])
      when is_binary(conversation_id) do
    Conversation
    |> where(id: ^conversation_id)
    |> preload(^preloads)
    |> Repo.one()
  end

  def active_participant_ids(%Conversation{participants: participants}) do
    participants |> Enum.filter(&is_nil(&1.left_at)) |> Enum.map(& &1.user_id)
  end

  def open_conversation(user_ids, kind, options \\ []) when is_list(user_ids) do
    [first, second] = Enum.sort(user_ids)
    conversation_id = Keyword.get(options, :id) || conversation_id(first, second)
    now = DateTime.utc_now()

    result =
      Repo.transaction(fn ->
        Repo.insert!(
          %Conversation{id: conversation_id, kind: kind},
          on_conflict: [set: [kind: kind, updated_at: now]],
          conflict_target: :id
        )

        open? =
          Participant
          |> where([participant], participant.conversation_id == ^conversation_id)
          |> where(
            [participant],
            participant.user_id in ^user_ids and is_nil(participant.left_at)
          )
          |> Repo.aggregate(:count) == length(user_ids)

        Repo.insert_all(
          Participant,
          Enum.map(user_ids, fn user_id ->
            %{
              conversation_id: conversation_id,
              user_id: user_id,
              active_at: now,
              created_at: now
            }
          end),
          on_conflict: [set: [left_at: nil, active_at: now]],
          conflict_target: [:conversation_id, :user_id]
        )

        if not open? and Keyword.get(options, :match_message, true) do
          insert_message!(conversation_id, %Message{
            system: true,
            kind: :match,
            text: @match_message
          })
        end
      end)

    with {:ok, message} <- result do
      if message, do: broadcast_message(message)
      Enum.each(user_ids, &broadcast_conversation(&1, conversation_id))
      {:ok, get_conversation(conversation_id)}
    end
  end

  def disband(conversation_id) when is_binary(conversation_id) do
    {_, user_ids} =
      Participant
      |> where([participant], participant.conversation_id == ^conversation_id)
      |> where([participant], is_nil(participant.left_at))
      |> select([participant], participant.user_id)
      |> Repo.update_all(set: [left_at: DateTime.utc_now(), unread_count: 0])

    if user_ids != [] do
      close(conversation_id)
      Enum.each(user_ids, &broadcast_conversation(&1, conversation_id, false))
    end

    {:ok, nil}
  end

  def unmatch(user_id, target_id), do: disband(conversation_id(user_id, target_id))

  def close(conversation_id) do
    FlirtualWeb.Endpoint.broadcast(conversation_topic(conversation_id), "closed", %{})
  end

  def close_between(user_id, target_id) do
    conversation_id = conversation_id(user_id, target_id)
    close(conversation_id)
    Enum.each([user_id, target_id], &broadcast_conversation(&1, conversation_id))
  end

  def visibility_changed(user_id) do
    if enabled?() do
      {:ok, _} = %{"user_id" => user_id} |> ObanWorkers.ChatVisibility.new() |> Oban.insert()
    end

    :ok
  end

  def announce_visibility(user_id) do
    Participant
    |> where([participant], participant.user_id == ^user_id and is_nil(participant.left_at))
    |> join(:inner, [participant], other in Participant,
      on:
        other.conversation_id == participant.conversation_id and
          other.user_id != participant.user_id
    )
    |> select([_, other], {other.conversation_id, other.user_id, other.unread_count > 0})
    |> Repo.all()
    |> Enum.each(fn
      {conversation_id, other_id, true} ->
        broadcast_conversation(other_id, conversation_id)

      {conversation_id, other_id, false} ->
        broadcast_conversation(other_id, conversation_id, false)
    end)
  end

  def disconnect(user_id) do
    FlirtualWeb.Endpoint.broadcast(socket_id(user_id), "disconnect", %{})
  end

  def delete_user_conversations(user_id) do
    participants =
      Participant
      |> where(user_id: ^user_id)
      |> join(:inner, [participant], other in Participant,
        on: other.conversation_id == participant.conversation_id
      )
      |> select([participant, other], {participant.conversation_id, other.user_id})
      |> Repo.all()

    conversation_ids = participants |> Enum.map(&elem(&1, 0)) |> Enum.uniq()

    Conversation
    |> where([conversation], conversation.id in ^conversation_ids)
    |> Repo.delete_all()

    {:ok, Enum.reject(participants, fn {_, other_id} -> other_id == user_id end)}
  end

  def announce_deleted_conversations(user_id, conversations) do
    conversations |> Enum.map(&elem(&1, 0)) |> Enum.uniq() |> Enum.each(&close/1)

    Enum.each(conversations, fn {conversation_id, other_id} ->
      broadcast_conversation(other_id, conversation_id)
    end)

    disconnect(user_id)
  end

  def authorize(%User{} = user, participant_ids, action) when is_list(participant_ids) do
    participant? = user.id in participant_ids
    other_ids = Enum.reject(participant_ids, &(&1 == user.id))

    cond do
      participant? and reachable?(user, other_ids) -> {:ok, :participant, other_ids}
      participant? -> :error
      action == :read and :moderator in user.tags -> {:ok, :moderator, other_ids}
      true -> :error
    end
  end

  defp reachable?(%User{} = user, [other_id]) do
    case Users.get(other_id, []) do
      %User{} = other ->
        (other.status == :visible or :moderator in user.tags) and
          not Block.between?(user.id, other_id)

      nil ->
        false
    end
  end

  defp reachable?(_, _), do: false

  def access(%User{} = user, conversation_id, action \\ :read) when is_binary(conversation_id) do
    with %Conversation{} = conversation <- get_conversation(conversation_id, [:participants]),
         {:ok, role, other_ids} <-
           authorize(user, active_participant_ids(conversation), action) do
      {:ok,
       %{
         conversation: conversation,
         role: role,
         participant: Enum.find(conversation.participants, &(&1.user_id == user.id)),
         other_ids: other_ids
       }}
    else
      _ -> {:error, :not_found}
    end
  end

  def can_write(%User{banned_at: banned_at}) when not is_nil(banned_at),
    do: {:error, :account_banned}

  def can_write(%User{deactivated_at: deactivated_at}) when not is_nil(deactivated_at),
    do: {:error, :account_deactivated}

  def can_write(%User{disabled_until_acknowledged: true}), do: {:error, :warning_unacknowledged}
  def can_write(%User{}), do: :ok

  def list_conversations(user_id, options \\ []) do
    limit = Keyword.get(options, :limit, 10)

    Participant
    |> where([participant], participant.user_id == ^user_id and is_nil(participant.left_at))
    |> then(fn query ->
      case Keyword.get(options, :before) do
        %DateTime{} = before -> where(query, [participant], participant.active_at < ^before)
        _ -> query
      end
    end)
    |> order_by([participant], desc: participant.active_at, desc: participant.conversation_id)
    |> limit(^limit)
    |> preload(conversation: [:participants, :last_message])
    |> Repo.all()
  end

  defp unread_participants(user_id) do
    blocks =
      from(block in Block,
        where:
          (block.profile_id == ^user_id and block.target_id == parent_as(:other).user_id) or
            (block.target_id == ^user_id and block.profile_id == parent_as(:other).user_id)
      )

    Participant
    |> where([participant], participant.user_id == ^user_id and is_nil(participant.left_at))
    |> where([participant], participant.unread_count > 0)
    |> join(:inner, [participant], other in Participant,
      as: :other,
      on:
        other.conversation_id == participant.conversation_id and
          other.user_id != participant.user_id
    )
    |> join(:inner, [other: other], user in User,
      on: user.id == other.user_id and user.status == :visible
    )
    |> where(not exists(blocks))
  end

  def unread_conversation_ids(user_id) do
    user_id
    |> unread_participants()
    |> order_by([participant], desc: participant.active_at)
    |> limit(^(@unread_limit + 1))
    |> select([participant], participant.conversation_id)
    |> Repo.all()
  end

  def unread_limit, do: @unread_limit

  defp visible_messages(conversation_id) do
    Message
    |> where([message], message.conversation_id == ^conversation_id)
    |> where([message], is_nil(message.deleted_at))
  end

  def list_messages(conversation_id, options \\ []) do
    limit = options |> Keyword.get(:limit, @page_size) |> min(@max_page_size) |> max(1)

    messages =
      conversation_id
      |> visible_messages()
      |> then(fn query ->
        case Keyword.get(options, :before) do
          before when is_integer(before) -> where(query, [message], message.seq < ^before)
          _ -> query
        end
      end)
      |> then(fn query ->
        case Keyword.get(options, :from) do
          from when is_integer(from) -> where(query, [message], message.seq >= ^from)
          _ -> query
        end
      end)
      |> order_by([message], desc: message.seq)
      |> limit(^(limit + 1))
      |> preload([:reactions, :reply_to])
      |> Repo.all()

    more =
      length(messages) > limit or
        case Keyword.get(options, :from) do
          from when is_integer(from) ->
            conversation_id
            |> visible_messages()
            |> where([message], message.seq < ^from)
            |> Repo.exists?()

          _ ->
            false
        end

    {messages |> Enum.take(limit) |> Enum.reverse(), more}
  end

  def changes(conversation_id, after_version) when is_integer(after_version) do
    messages =
      Message
      |> where([message], message.conversation_id == ^conversation_id)
      |> where([message], message.version > ^after_version)
      |> order_by([message], asc: message.version)
      |> limit(^(@sync_limit + 1))
      |> preload([:reactions, :reply_to])
      |> Repo.all()

    if length(messages) > @sync_limit, do: :reset, else: {:ok, messages}
  end

  def get_message(conversation_id, message_id) do
    with {:ok, message_id} <- Ecto.ShortUUID.cast(message_id) do
      Message
      |> where(conversation_id: ^conversation_id, id: ^message_id)
      |> preload([:reactions, :reply_to])
      |> Repo.one()
    else
      _ -> nil
    end
  end

  defp next_seq!(conversation_id, set \\ []) do
    {1, [seq]} =
      Conversation
      |> where(id: ^conversation_id)
      |> select([conversation], conversation.seq)
      |> Repo.update_all(inc: [seq: 1], set: [updated_at: DateTime.utc_now()] ++ set)

    seq
  end

  defp insert_message!(conversation_id, %Message{} = message, reply_to \\ nil) do
    id = Ecto.ShortUUID.generate()
    seq = next_seq!(conversation_id, last_message_id: id)
    now = DateTime.utc_now()

    message =
      Repo.insert!(%{
        message
        | id: id,
          conversation_id: conversation_id,
          seq: seq,
          version: seq,
          created_at: now
      })

    participants =
      where(Participant, [participant], participant.conversation_id == ^conversation_id)

    case message.sender_id do
      nil ->
        Repo.update_all(participants, set: [active_at: now], inc: [unread_count: 1])

      sender_id ->
        participants
        |> update([participant],
          set: [
            active_at: ^now,
            unread_count:
              fragment(
                "CASE WHEN ? THEN 0 ELSE ? + 1 END",
                participant.user_id == ^sender_id,
                participant.unread_count
              ),
            last_read_seq:
              fragment(
                "CASE WHEN ? THEN ? ELSE ? END",
                participant.user_id == ^sender_id,
                ^seq,
                participant.last_read_seq
              )
          ]
        )
        |> Repo.update_all([])
    end

    %{message | reactions: [], reply_to: reply_to}
  end

  defp validate(%Message{} = message, attrs) do
    case message |> Message.changeset(attrs) |> Ecto.Changeset.apply_action(:validate) do
      {:ok, message} -> {:ok, message}
      {:error, changeset} -> {:error, Message.error(changeset)}
    end
  end

  @gif_preview ~r/\Ahttps:\/\/static\d*\.klipy\.com\/\S+\.gif\z/

  defp gif_preview(%{"preview" => preview})
       when is_binary(preview) and byte_size(preview) <= 500 do
    if String.match?(preview, @gif_preview), do: preview
  end

  defp gif_preview(_), do: nil

  defp reply_target(_, nil), do: {:ok, nil}

  defp reply_target(conversation_id, reply_to_id) do
    case get_message(conversation_id, reply_to_id) do
      %Message{deleted_at: nil, system: false} = message -> {:ok, message}
      _ -> {:error, :message_not_found}
    end
  end

  defp existing_message(conversation_id, sender_id, client_id) do
    Message
    |> where(conversation_id: ^conversation_id, sender_id: ^sender_id, client_id: ^client_id)
    |> preload([:reactions, :reply_to])
    |> Repo.one()
  end

  @limits %{send: {10_000, 20}, action: {10_000, 60}}

  def rate_limit(kind, user_id) do
    {window, limit} = Map.fetch!(@limits, kind)

    case ExRated.check_rate("chat_#{kind}:#{user_id}", window, limit) do
      {:ok, _} -> :ok
      {:error, _} -> {:error, :rate_limited}
    end
  end

  defp writer(%User{} = user, conversation_id) do
    with :ok <- can_write(user),
         {:ok, %{other_ids: other_ids}} <- access(user, conversation_id, :write) do
      {:ok, other_ids}
    end
  end

  defp seq(conversation_id) do
    Conversation
    |> where(id: ^conversation_id)
    |> select([conversation], conversation.seq)
  end

  defp lock!(conversation_id),
    do: conversation_id |> seq() |> lock("FOR UPDATE") |> Repo.one!()

  def send_message(%User{} = sender, conversation_id, attrs) do
    with {:ok, other_ids} <- writer(sender, conversation_id),
         {:ok, message} <- validate(%Message{sender_id: sender.id}, attrs),
         {:ok, reply_to} <- reply_target(conversation_id, attrs["reply_to_id"]) do
      viewing = Enum.filter(other_ids, &viewing?(conversation_id, &1))

      result =
        Repo.transaction(fn ->
          message =
            insert_message!(
              conversation_id,
              %{message | reply_to_id: reply_to && reply_to.id},
              reply_to
            )

          Enum.each(other_ids -- viewing, fn recipient_id ->
            {:ok, _} =
              %{
                "message_id" => message.id,
                "recipient_id" => recipient_id,
                "gif_preview" => gif_preview(attrs["gif"])
              }
              |> ObanWorkers.ChatPush.new()
              |> Oban.insert()

            {:ok, _} =
              %{"conversation_id" => conversation_id, "recipient_id" => recipient_id}
              |> ObanWorkers.ChatEmail.new(schedule_in: ObanWorkers.ChatEmail.delay())
              |> Oban.insert()
          end)

          message
        end)

      with {:ok, message} <- result do
        broadcast_message(message)
        broadcast_conversation(sender.id, conversation_id, false)

        Enum.each(
          other_ids,
          &broadcast_conversation(&1, conversation_id, sender.status == :visible)
        )

        {:ok, message}
      end
    end
  rescue
    error in Ecto.ConstraintError ->
      with {:ok, client_id} <- Ecto.UUID.cast(attrs["client_id"]),
           %Message{} = message <- existing_message(conversation_id, sender.id, client_id) do
        {:ok, message}
      else
        _ -> reraise error, __STACKTRACE__
      end
  end

  def send_system_message(conversation_id, text) do
    with {:ok, message} <-
           Repo.transaction(fn ->
             insert_message!(conversation_id, %Message{system: true, text: text})
           end) do
      broadcast_message(message)
      {:ok, message}
    end
  end

  defp own_message(%User{} = user, conversation_id, message_id) do
    case get_message(conversation_id, message_id) do
      %Message{deleted_at: nil, system: false, sender_id: sender_id} = message
      when sender_id == user.id ->
        {:ok, message}

      _ ->
        {:error, :message_not_found}
    end
  end

  defp touch!(%Message{} = message, changes) do
    version = next_seq!(message.conversation_id)

    message
    |> Ecto.Changeset.change(Map.put(changes, :version, version))
    |> Repo.update!()
    |> Repo.preload([:reactions, :reply_to], force: true)
  end

  def edit_message(%User{} = user, conversation_id, message_id, text) do
    with {:ok, other_ids} <- writer(user, conversation_id),
         {:ok, %Message{text: text}} <- validate(%Message{}, %{"text" => text}),
         {:ok, {changed?, message}} <-
           Repo.transaction(fn ->
             lock!(conversation_id)

             case own_message(user, conversation_id, message_id) do
               {:ok, %Message{text: ^text} = message} ->
                 {false, message}

               {:ok, message} ->
                 {true, touch!(message, %{text: text, edited_at: DateTime.utc_now()})}

               {:error, reason} ->
                 Repo.rollback(reason)
             end
           end) do
      if changed? do
        broadcast_message(message)
        Enum.each([user.id | other_ids], &broadcast_conversation(&1, conversation_id))
      end

      {:ok, message}
    end
  end

  def delete_message(%User{} = user, conversation_id, message_id) do
    with {:ok, other_ids} <- writer(user, conversation_id),
         {:ok, message} <-
           Repo.transaction(fn ->
             lock!(conversation_id)

             case own_message(user, conversation_id, message_id) do
               {:ok, message} -> delete_message!(user, message)
               {:error, reason} -> Repo.rollback(reason)
             end
           end) do
      broadcast_message(message)
      Enum.each([user.id | other_ids], &broadcast_conversation(&1, conversation_id))
      {:ok, message}
    end
  end

  defp delete_message!(%User{} = user, %Message{conversation_id: conversation_id} = message) do
    Reaction |> where(message_id: ^message.id) |> Repo.delete_all()

    message =
      touch!(message, %{
        text: "",
        gif_width: nil,
        gif_height: nil,
        deleted_at: DateTime.utc_now()
      })

    Participant
    |> where([participant], participant.conversation_id == ^conversation_id)
    |> where([participant], participant.last_read_seq < ^message.seq)
    |> where([participant], participant.unread_count > 0)
    |> where([participant], participant.user_id != ^user.id)
    |> Repo.update_all(inc: [unread_count: -1])

    last_message_id =
      conversation_id
      |> visible_messages()
      |> order_by([message], desc: message.seq)
      |> limit(1)
      |> select([message], message.id)
      |> Repo.one()

    Conversation
    |> where(id: ^conversation_id)
    |> Repo.update_all(set: [last_message_id: last_message_id])

    message
  end

  defp valid_emoji?(emoji) when is_binary(emoji) do
    String.match?(emoji, ~r/\A:\w{1,32}:\z/) or
      (byte_size(emoji) <= 64 and String.length(emoji) == 1 and
         not String.match?(emoji, ~r/\A[\p{L}\p{N}\p{Z}\p{C}\p{P}]\z/u))
  end

  defp valid_emoji?(_), do: false

  def react(%User{} = user, conversation_id, message_id, emoji, add?) do
    with {:ok, _} <- writer(user, conversation_id),
         true <- valid_emoji?(emoji) || {:error, :invalid_emoji} do
      result =
        Repo.transaction(fn ->
          lock!(conversation_id)

          message =
            case get_message(conversation_id, message_id) do
              %Message{deleted_at: nil} = message -> message
              _ -> Repo.rollback(:message_not_found)
            end

          changed =
            if add? do
              emojis = message.reactions |> Enum.map(& &1.emoji) |> Enum.uniq()

              if emoji not in emojis and length(emojis) >= @max_reactions,
                do: Repo.rollback(:too_many_reactions)

              {count, _} =
                Repo.insert_all(
                  Reaction,
                  [
                    %{
                      message_id: message.id,
                      user_id: user.id,
                      emoji: emoji,
                      created_at: DateTime.utc_now()
                    }
                  ],
                  on_conflict: :nothing
                )

              count
            else
              {count, _} =
                Reaction
                |> where(message_id: ^message.id, user_id: ^user.id, emoji: ^emoji)
                |> Repo.delete_all()

              count
            end

          if changed > 0, do: {:changed, touch!(message, %{})}, else: {:unchanged, message}
        end)

      case result do
        {:ok, {:changed, message}} ->
          broadcast_message(message)
          {:ok, message}

        {:ok, {:unchanged, message}} ->
          {:ok, message}

        {:error, reason} ->
          {:error, reason}
      end
    end
  end

  def mark_read(user_id, conversation_id, seen \\ nil) do
    {:ok, {count, _}} =
      Repo.transaction(fn ->
        seq = conversation_id |> seq() |> lock("FOR SHARE") |> Repo.one() || 0
        position = if is_integer(seen), do: seen |> min(seq) |> max(0), else: seq

        Participant
        |> where([participant], participant.conversation_id == ^conversation_id)
        |> where([participant], participant.user_id == ^user_id)
        |> where(
          [participant],
          participant.unread_count > 0 or participant.last_read_seq < ^position
        )
        |> update([participant],
          set: [
            last_read_seq: fragment("GREATEST(?, ?)", participant.last_read_seq, ^position),
            unread_count:
              fragment(
                "(SELECT count(*) FROM messages AS message WHERE message.conversation_id = ? AND message.seq > GREATEST(?, ?) AND message.deleted_at IS NULL AND message.sender_id IS DISTINCT FROM ?)",
                participant.conversation_id,
                participant.last_read_seq,
                ^position,
                participant.user_id
              )
          ]
        )
        |> Repo.update_all([])
      end)

    if count > 0, do: broadcast_conversation(user_id, conversation_id)
    {:ok, nil}
  end

  def mark_all_read(user_id) do
    Participant
    |> where([participant], participant.user_id == ^user_id and is_nil(participant.left_at))
    |> where([participant], participant.unread_count > 0)
    |> select([participant], participant.conversation_id)
    |> Repo.all()
    |> Enum.each(&mark_read(user_id, &1))

    {:ok, nil}
  end

  def viewing?(conversation_id, user_id) do
    FlirtualWeb.Presence.get_by_key(viewing_topic(conversation_id), user_id) != []
  end

  defp broadcast_message(%Message{} = message) do
    FlirtualWeb.Endpoint.broadcast(conversation_topic(message.conversation_id), "message", %{
      message: message
    })
  end

  defp broadcast_conversation(user_id, conversation_id) do
    unread =
      user_id
      |> unread_participants()
      |> where([participant], participant.conversation_id == ^conversation_id)
      |> Repo.exists?()

    broadcast_conversation(user_id, conversation_id, unread)
  end

  defp broadcast_conversation(user_id, conversation_id, unread) do
    FlirtualWeb.Endpoint.broadcast(user_topic(user_id), "conversation", %{
      id: conversation_id,
      unread: unread
    })
  end

  def text(%Message{text: text}, options \\ []) do
    if Keyword.get(options, :unmasked, false), do: text, else: Links.mask(text)
  end

  def render(message, options \\ [])

  def render(%Message{deleted_at: deleted_at} = message, _) when not is_nil(deleted_at) do
    %{id: message.id, seq: message.seq, version: message.version, deleted: true}
  end

  def render(%Message{} = message, options) do
    {text, links} = Links.render(message.text, options)

    %{
      id: message.id,
      seq: message.seq,
      version: message.version,
      system: message.system,
      kind: message.kind,
      sender_id: message.sender_id,
      client_id: message.client_id,
      text: text,
      links: links,
      reply_to: render_reply(message.reply_to, options),
      gif:
        if(message.gif_width && message.gif_height,
          do: %{width: message.gif_width, height: message.gif_height}
        ),
      reactions: render_reactions(message.reactions),
      edited_at: message.edited_at,
      created_at: message.created_at
    }
  end

  defp render_reply(%Message{deleted_at: nil} = message, options) do
    {text, links} = Links.render(message.text, options)
    %{id: message.id, seq: message.seq, sender_id: message.sender_id, text: text, links: links}
  end

  defp render_reply(_, _), do: nil

  defp render_reactions(reactions) when is_list(reactions) do
    reactions
    |> Enum.reduce([], fn reaction, groups ->
      case List.keyfind(groups, reaction.emoji, 0) do
        nil ->
          groups ++ [{reaction.emoji, [reaction.user_id]}]

        {emoji, user_ids} ->
          List.keyreplace(groups, emoji, 0, {emoji, user_ids ++ [reaction.user_id]})
      end
    end)
    |> Enum.map(fn {emoji, user_ids} -> %{emoji: emoji, user_ids: user_ids} end)
  end

  defp render_reactions(_), do: []
end

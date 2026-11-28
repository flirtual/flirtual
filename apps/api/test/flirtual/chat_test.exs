defmodule Flirtual.ChatTest do
  use ExUnit.Case, async: false

  import Ecto.Query
  import Phoenix.ChannelTest

  @endpoint FlirtualWeb.Endpoint

  alias Flirtual.{Chat, Repo, User, Users}
  alias Flirtual.Chat.{Conversation, Participant}
  alias Flirtual.User.Profile.{Block, LikesAndPasses}
  alias Flirtual.User.Session

  @conversation "chattest"

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
    Ecto.Adapters.SQL.Sandbox.mode(Repo, {:shared, self()})

    [sender, recipient] =
      for name <- ["sender", "recipient"] do
        user =
          Repo.insert!(%User{
            email: "#{name}@chat.test",
            slug: "chattest#{name}",
            status: :visible,
            password_hash: "x"
          })

        Repo.insert_all(Flirtual.User.Profile, [
          %{user_id: user.id, updated_at: DateTime.truncate(DateTime.utc_now(), :second)}
        ])

        Users.get(user.id, [])
      end

    {:ok, _} =
      Chat.open_conversation([sender.id, recipient.id], :love,
        id: @conversation,
        match_message: false
      )

    %{sender: sender, recipient: recipient}
  end

  defp state do
    conversation = Repo.get(Conversation, @conversation)

    participants =
      Participant
      |> where(conversation_id: @conversation)
      |> Repo.all()
      |> Map.new(&{&1.user_id, &1})

    {conversation, participants}
  end

  defp send_message(sender, attrs \\ %{}) do
    Oban.Testing.with_testing_mode(:manual, fn ->
      Chat.send_message(
        sender,
        @conversation,
        Map.merge(%{"text" => "hello", "client_id" => Ecto.UUID.generate()}, attrs)
      )
    end)
  end

  test "a message advances the conversation and both read positions", context do
    %{sender: sender, recipient: recipient} = context

    assert {:ok, message} = send_message(sender)
    {conversation, participants} = state()

    assert message.seq == 1
    assert message.reactions == []
    assert message.reply_to == nil
    assert conversation.seq == 1
    assert conversation.last_message_id == message.id
    assert participants[sender.id].unread_count == 0
    assert participants[sender.id].last_read_seq == 1
    assert participants[recipient.id].unread_count == 1
    assert participants[recipient.id].last_read_seq == 0
  end

  test "each message adds to the recipient's unread count", %{
    sender: sender,
    recipient: recipient
  } do
    assert {:ok, _} = send_message(sender)
    assert {:ok, _} = send_message(sender)

    {_, participants} = state()
    assert participants[recipient.id].unread_count == 2
    assert participants[sender.id].last_read_seq == 2
  end

  test "replying clears the replier's unread count", %{sender: sender, recipient: recipient} do
    assert {:ok, _} = send_message(sender)
    assert {:ok, _} = send_message(recipient)

    {_, participants} = state()
    assert participants[recipient.id].unread_count == 0
    assert participants[sender.id].unread_count == 1
  end

  test "sending the same client id twice returns the first message", %{
    sender: sender,
    recipient: recipient
  } do
    client_id = Ecto.UUID.generate()

    assert {:ok, first} = send_message(sender, %{"client_id" => client_id})
    assert {:ok, second} = send_message(sender, %{"client_id" => client_id})
    {conversation, participants} = state()

    assert second.id == first.id
    assert conversation.seq == 1
    assert participants[recipient.id].unread_count == 1
  end

  test "a reply carries the message it answers", %{sender: sender, recipient: recipient} do
    assert {:ok, first} = send_message(sender, %{"text" => "question"})

    assert {:ok, reply} =
             send_message(recipient, %{"text" => "answer", "reply_to_id" => first.id})

    assert reply.reply_to.id == first.id
    assert Chat.render(reply).reply_to.text == "question"
  end

  test "a system message is unread for everyone", %{sender: sender, recipient: recipient} do
    assert {:ok, message} = Chat.send_system_message(@conversation, "It's a match!")
    {conversation, participants} = state()

    assert conversation.last_message_id == message.id
    assert participants[sender.id].unread_count == 1
    assert participants[recipient.id].unread_count == 1
  end

  test "a block in either direction closes the conversation", %{
    sender: sender,
    recipient: recipient
  } do
    now = DateTime.truncate(DateTime.utc_now(), :second)

    Repo.insert_all(Block, [
      %{
        id: Ecto.ShortUUID.generate(),
        profile_id: recipient.id,
        target_id: sender.id,
        created_at: now
      }
    ])

    assert Block.between?(sender.id, recipient.id)
    assert Block.between?(recipient.id, sender.id)
    assert send_message(sender) == {:error, :not_found}
    assert send_message(recipient) == {:error, :not_found}
  end

  test "a ranged page of history still reports older messages", %{sender: sender} do
    for _ <- 1..4, do: {:ok, _} = send_message(sender)

    assert {[%{seq: 3}], true} = Chat.list_messages(@conversation, before: 4, from: 3)
    assert {[%{seq: 1}, %{seq: 2}], false} = Chat.list_messages(@conversation, before: 3, from: 1)
  end

  test "a conversation with someone no longer visible isn't counted as unread", %{
    sender: sender,
    recipient: recipient
  } do
    {:ok, _} = send_message(sender)
    assert Chat.unread_conversation_ids(recipient.id) == [@conversation]

    User |> where(id: ^sender.id) |> Repo.update_all(set: [status: :finished_profile])
    assert Chat.unread_conversation_ids(recipient.id) == []
  end

  test "reading up to a position leaves later messages unread", %{
    sender: sender,
    recipient: recipient
  } do
    {:ok, %{seq: seen}} = send_message(sender)
    {:ok, _} = send_message(sender)

    Chat.mark_read(recipient.id, @conversation, seen)
    {_, participants} = state()
    assert %{last_read_seq: ^seen, unread_count: 1} = participants[recipient.id]

    Chat.mark_read(recipient.id, @conversation)
    {conversation, participants} = state()
    assert participants[recipient.id].last_read_seq == conversation.seq
    assert participants[recipient.id].unread_count == 0
  end

  test "opening an open conversation again doesn't repeat the match message", %{
    sender: sender,
    recipient: recipient
  } do
    matches = fn ->
      {messages, _} = Chat.list_messages(@conversation)
      Enum.count(messages, & &1.system)
    end

    {:ok, _} = Chat.open_conversation([sender.id, recipient.id], :love, id: @conversation)
    assert matches.() == 0

    Chat.disband(@conversation)
    {:ok, _} = Chat.open_conversation([sender.id, recipient.id], :love, id: @conversation)
    {:ok, _} = Chat.open_conversation([sender.id, recipient.id], :love, id: @conversation)
    assert matches.() == 1

    {[message], _} = Chat.list_messages(@conversation)
    assert %{kind: :match, system: true} = Chat.render(message)
  end

  test "matches are told when someone stops or starts being visible", %{
    sender: sender,
    recipient: recipient
  } do
    {:ok, _} = send_message(sender)
    FlirtualWeb.Endpoint.subscribe(Chat.user_topic(recipient.id))

    status = fn status ->
      User |> where(id: ^sender.id) |> Repo.update_all(set: [status: status])
    end

    status.(:finished_profile)
    Chat.announce_visibility(sender.id)
    assert_receive %Phoenix.Socket.Broadcast{event: "conversation", payload: %{unread: false}}

    status.(:visible)
    Chat.announce_visibility(sender.id)
    assert_receive %Phoenix.Socket.Broadcast{event: "conversation", payload: %{unread: true}}
  end

  test "a message is trimmed, and refused when empty, too long or badly identified", %{
    sender: sender
  } do
    assert {:ok, %{text: "hi\nthere"}} = send_message(sender, %{"text" => "  hi\r\nthere \n"})
    assert {:error, :empty_message} = send_message(sender, %{"text" => " \n "})
    assert {:error, :empty_message} = send_message(sender, %{"text" => 5})

    assert {:error, :message_too_long} =
             send_message(sender, %{"text" => String.duplicate("a", 10_001)})

    assert {:ok, _} = send_message(sender, %{"text" => String.duplicate("😀", 10_000)})
    assert {:error, :invalid_message} = send_message(sender, %{"text" => <<"a", 255>>})
    assert {:error, :invalid_client_id} = send_message(sender, %{"client_id" => "nope"})
  end

  test "a GIF's size is kept only when it is plausible", %{sender: sender} do
    assert {:ok, %{gif_width: 200, gif_height: 100}} =
             send_message(sender, %{"gif" => %{"width" => 200, "height" => 100}})

    assert {:ok, %{gif_width: nil, gif_height: nil}} =
             send_message(sender, %{"gif" => %{"width" => 0, "height" => "tall"}})
  end

  test "an edit goes through the same checks", %{sender: sender} do
    {:ok, message} = send_message(sender)

    assert {:error, :empty_message} = Chat.edit_message(sender, @conversation, message.id, "  ")

    assert {:ok, %{text: "new", edited_at: %DateTime{}}} =
             Chat.edit_message(sender, @conversation, message.id, " new ")

    assert {:ok, %{text: "new"}} = Chat.edit_message(sender, @conversation, message.id, "new")
  end

  test "a moderator outside the conversation may read it but not write", %{
    sender: sender,
    recipient: recipient
  } do
    moderator = %User{id: Ecto.ShortUUID.generate(), tags: [:moderator]}
    stranger = %User{id: Ecto.ShortUUID.generate(), tags: []}
    participants = [sender.id, recipient.id]

    assert {:ok, :moderator, _} = Chat.authorize(moderator, participants, :read)
    assert :error = Chat.authorize(moderator, participants, :write)
    assert :error = Chat.authorize(stranger, participants, :read)
    assert {:ok, :participant, [_]} = Chat.authorize(sender, participants, :write)
  end

  test "a live message is masked for a participant and readable for a watching moderator", %{
    sender: sender,
    recipient: recipient
  } do
    moderator =
      Repo.insert!(%User{
        email: "moderator@chat.test",
        slug: "chattestmoderator",
        status: :visible,
        tags: [:moderator],
        password_hash: "x"
      })

    join = fn user ->
      FlirtualWeb.ChatSocket
      |> socket(Chat.socket_id(user.id), %{user_id: user.id})
      |> subscribe_and_join("conversation:" <> @conversation, %{})
    end

    {:ok, %{read_only: false}, participant} = join.(recipient)
    {:ok, _} = send_message(sender, %{"text" => "go to evil.com"})
    assert_push "message", %{message: %{text: "go to (Unknown link blocked)"}}
    Process.unlink(participant.channel_pid)
    assert_reply leave(participant), :ok

    {:ok, %{read_only: true}, _} = join.(moderator)
    {:ok, _} = send_message(sender, %{"text" => "go to evil.com"})
    assert_push "message", %{message: %{text: "go to evil.com", links: []}}
  end

  test "someone outside the conversation can't send to it", %{sender: sender} do
    outsider =
      Repo.insert!(%User{
        email: "outsider@chat.test",
        slug: "chattestoutsider",
        status: :visible,
        password_hash: "x"
      })

    assert Chat.send_message(Users.get(outsider.id, []), @conversation, %{"text" => "hi"}) ==
             {:error, :not_found}

    assert {:ok, _} = send_message(sender)
  end

  test "leaving closes the conversation for both people", %{sender: sender, recipient: recipient} do
    {:ok, _} = send_message(sender)
    FlirtualWeb.Endpoint.subscribe(Chat.conversation_topic(@conversation))
    FlirtualWeb.Endpoint.subscribe(Chat.user_topic(sender.id))

    for {profile, target} <- [{sender, recipient}, {recipient, sender}] do
      Repo.insert!(%LikesAndPasses{
        profile_id: profile.id,
        target_id: target.id,
        type: :like,
        kind: :love
      })
    end

    conn =
      Plug.Test.conn(:delete, "/v1/conversations/" <> @conversation)
      |> Plug.Conn.assign(:session, %{user: recipient, user_id: recipient.id})

    assert %Plug.Conn{status: 200} =
             FlirtualWeb.ConversationController.leave(conn, %{"conversation_id" => @conversation})

    assert [%LikesAndPasses{profile_id: profile_id}] = Repo.all(LikesAndPasses)
    assert profile_id == sender.id

    {_, participants} = state()
    assert Enum.all?(Map.values(participants), &(&1.left_at && &1.unread_count == 0))
    assert Chat.unread_conversation_ids(recipient.id) == []
    assert Chat.send_message(sender, @conversation, %{"text" => "hi"}) == {:error, :not_found}

    assert_receive %Phoenix.Socket.Broadcast{event: "closed"}
    assert_receive %Phoenix.Socket.Broadcast{event: "conversation", payload: %{unread: false}}
  end

  test "someone outside the conversation can't make it leave", %{sender: sender} do
    outsider =
      Repo.insert!(%User{
        email: "outsider@chat.test",
        slug: "chattestoutsider",
        status: :visible,
        password_hash: "x"
      })

    FlirtualWeb.Endpoint.subscribe(Chat.conversation_topic(@conversation))

    conn =
      Plug.Test.conn(:delete, "/v1/conversations/" <> @conversation)
      |> Plug.Conn.assign(:session, %{user: outsider, user_id: outsider.id})

    assert FlirtualWeb.ConversationController.leave(conn, %{"conversation_id" => @conversation}) ==
             {:error, {:not_found, :conversation_not_found}}

    refute_receive %Phoenix.Socket.Broadcast{event: "closed"}
    assert {:ok, _} = send_message(sender)
  end

  test "a socket token stops working once its session is gone", %{sender: sender} do
    [session, other] =
      for _ <- 1..2 do
        Repo.insert!(%Session{
          user_id: sender.id,
          hashed_token: Session.hash_token(Session.new_token()),
          expire_at: Session.new_expire_at()
        })
      end

    token = FlirtualWeb.ChatSocket.token(session)

    assert {:ok, _} = connect(FlirtualWeb.ChatSocket, %{"token" => token})

    Session.delete(id: session.id)

    assert :error = connect(FlirtualWeb.ChatSocket, %{"token" => token})

    assert {:ok, _} =
             connect(FlirtualWeb.ChatSocket, %{"token" => FlirtualWeb.ChatSocket.token(other)})
  end

  test "an emoji ending in a newline is refused", %{sender: sender} do
    {:ok, message} = send_message(sender)

    assert {:ok, _} = Chat.react(sender, @conversation, message.id, ":wave:", true)

    assert Chat.react(sender, @conversation, message.id, ":wave:\n", true) ==
             {:error, :invalid_emoji}
  end

  test "conversations active at the same moment aren't skipped between pages", %{
    sender: sender
  } do
    ids =
      for name <- ["a", "b", "c"] do
        other =
          Repo.insert!(%User{
            email: "#{name}@chat.test",
            slug: "chattest#{name}",
            status: :visible,
            password_hash: "x"
          })

        {:ok, conversation} =
          Chat.open_conversation([sender.id, other.id], :love, match_message: false)

        conversation.id
      end

    active_at = DateTime.utc_now()

    Participant
    |> where([participant], participant.user_id == ^sender.id)
    |> Repo.update_all(set: [active_at: active_at])

    {:ok, {first, %{next: next}}} =
      Flirtual.Conversation.list(sender.id, page_cursor(2))

    {:ok, {second, _}} = Flirtual.Conversation.list(sender.id, next)

    assert Enum.sort(Enum.map(first ++ second, & &1.id)) == Enum.sort([@conversation | ids])
  end

  defp page_cursor(limit) do
    {nil, nil, 0, limit} |> :erlang.term_to_binary() |> Base.url_encode64()
  end
end

defmodule Flirtual.Conversation do
  use Flirtual.Schema, primary_key: :id
  use Flirtual.Policy.Target, policy: Flirtual.Conversation.Policy
  use Flirtual.Logger, :conversation

  require Flirtual.Utilities
  import Flirtual.Utilities

  alias Flirtual.Chat
  alias Flirtual.Conversation
  alias Flirtual.Conversation.Message
  alias Flirtual.Conversation.Cursor
  alias Flirtual.Talkjs
  alias Flirtual.User.Profile.LikesAndPasses

  embedded_schema do
    field :subject, :string
    field :kind, Ecto.Enum, values: Ecto.Enum.values(LikesAndPasses, :kind)

    field :participants, {:array, :binary_id}
    field :last_message, :map
    field :is_unread, :boolean, virtual: false

    field :user_id, :binary_id, virtual: true
    field :active_at, :utc_datetime_usec, virtual: true

    timestamps(updated_at: false)
  end

  def encode(:kind, :love), do: "❤️"
  def encode(:kind, :friend), do: "✌️"

  defp decode(:subject, subject) do
    if String.contains?(subject, "✌️") do
      :friend
    else
      :love
    end
  end

  defp decode([]), do: []
  defp decode(data) when is_list(data), do: Enum.map(data, &decode(&1))

  defp decode(%{"participants" => participants}) when participants === %{}, do: nil

  defp decode(%{} = data) do
    %Conversation{
      id: data["id"],
      kind: decode(:subject, data["subject"]),
      participants:
        data["participants"]
        # Filter out read-only admin observers
        |> Enum.filter(fn {_, info} -> info["access"] != "Read" end)
        |> Enum.map(fn {id, _} -> ShortUUID.encode!(id) end),
      last_message: data["lastMessage"] |> Message.decode(),
      is_unread: data["isUnread"],
      created_at: DateTime.from_unix!(data["createdAt"], :millisecond)
    }
  end

  defmodule Cursor do
    import Flirtual.Utilities

    @derive [{Jason.Encoder, only: [:page, :limit]}]
    defstruct before: nil, last_before: nil, page: 0, limit: 10

    @max_limit 100

    defguardp is_position(value)
              when is_nil(value) or is_integer(value) or
                     (is_tuple(value) and tuple_size(value) == 2 and is_integer(elem(value, 0)) and
                        is_binary(elem(value, 1)))

    def map(self, data) do
      %{
        previous: self |> previous(data) |> encode(),
        next: self |> next(data) |> encode(),
        page: self.page
      }
      |> exclude_nil()
    end

    def first(), do: %Cursor{}

    def encode(nil), do: nil

    def encode(%Cursor{page: page} = cursor)
        when is_integer(page) and page > 0 do
      :erlang.term_to_binary(
        {
          cursor.last_before,
          cursor.before,
          cursor.page,
          cursor.limit
        },
        [
          :compressed
        ]
      )
      |> Base.url_encode64()
    end

    def encode(_), do: nil

    # sobelow_skip ["Misc.BinToTerm"]
    def decode(token) when is_binary(token) do
      with {:ok, binary} <- Base.url_decode64(token),
           {
             last_before,
             before,
             page,
             limit
           }
           when is_position(last_before) and is_position(before) and is_integer(page) and
                  is_integer(limit) <-
             :erlang.binary_to_term(binary, [:safe]) do
        %Cursor{
          before: before,
          last_before: last_before,
          page: page,
          limit: limit |> max(1) |> min(@max_limit)
        }
      else
        _ -> first()
      end
    end

    def decode(_), do: first()

    def next(_, []), do: nil

    def next(%Cursor{} = self, data) do
      if length(data) == self.limit do
        last_conversation = data |> List.last()

        %Cursor{
          before:
            (last_conversation[:last_message] || last_conversation)[:created_at]
            |> DateTime.to_unix(:millisecond),
          last_before: self.before,
          page: self.page + 1,
          limit: self.limit
        }
      else
        nil
      end
    end

    def previous(%Cursor{page: 1}, _), do: nil

    def previous(%Cursor{} = self, _) do
      %Cursor{
        before: self.last_before,
        last_before: nil,
        page: self.page - 1,
        limit: self.limit
      }
    end
  end

  def get(conversation_id, viewer_id \\ nil)

  def get(conversation_id, viewer_id) when is_binary(conversation_id) do
    if Chat.enabled?(),
      do: get_from_chat(conversation_id, viewer_id),
      else: get_from_talkjs(conversation_id)
  end

  defp get_from_chat(conversation_id, viewer_id) do
    case Chat.get_conversation(conversation_id) do
      %Chat.Conversation{} = conversation -> {:ok, from_chat(conversation, viewer_id)}
      nil -> {:error, :not_found}
    end
  end

  def from_chat(%Chat.Conversation{} = conversation, viewer_id, active_at \\ nil) do
    participants = Enum.filter(conversation.participants, &is_nil(&1.left_at))
    viewer = Enum.find(participants, &(&1.user_id == viewer_id))

    %Conversation{
      id: conversation.id,
      kind: conversation.kind,
      participants: Enum.map(participants, & &1.user_id),
      last_message:
        case conversation.last_message do
          %Chat.Message{deleted_at: nil} = message -> Message.from_chat(message, participants)
          _ -> nil
        end,
      is_unread: !!viewer and viewer.unread_count > 0,
      active_at: active_at,
      created_at: conversation.created_at
    }
  end

  defp get_from_talkjs(conversation_id) do
    with {:ok, %Req.Response{body: body}} <-
           Talkjs.fetch(
             :get,
             "conversations/" <> conversation_id,
             nil
           ),
         {:ok, data} <- Jason.decode(body),
         %{"id" => _} <- data,
         %Conversation{} = conversation <- decode(data) do
      {:ok, conversation}
    else
      nil ->
        {:error, :not_found}

      %{"errorCode" => "CONVERSATION_NOT_FOUND"} ->
        {:error, :not_found}

      reason ->
        log(:error, [:get], reason: reason)
        {:error, :upstream}
    end
  end

  def list(user_id, token \\ nil) do
    if Chat.enabled?(), do: list_from_chat(user_id, token), else: list_from_talkjs(user_id, token)
  end

  defp list_from_chat(user_id, token) do
    cursor = Cursor.decode(token)

    data =
      user_id
      |> Chat.list_conversations(
        limit: cursor.limit,
        before: chat_position(cursor.before)
      )
      |> Enum.map(&from_chat(&1.conversation, user_id, &1.active_at))

    next =
      if length(data) == cursor.limit do
        last = List.last(data)

        %Cursor{
          before: {DateTime.to_unix(last.active_at, :microsecond), last.id},
          last_before: cursor.before,
          page: cursor.page + 1,
          limit: cursor.limit
        }
      end

    {:ok,
     {data,
      %{
        previous: cursor |> Cursor.previous(data) |> Cursor.encode(),
        next: Cursor.encode(next),
        page: cursor.page
      }
      |> exclude_nil()}}
  end

  defp chat_position({microseconds, conversation_id}) do
    case DateTime.from_unix(microseconds, :microsecond) do
      {:ok, active_at} -> {active_at, conversation_id}
      _ -> nil
    end
  end

  defp chat_position(_), do: nil

  defp list_from_talkjs(user_id, token) do
    cursor = Cursor.decode(token)

    query =
      %{
        limit: cursor.limit,
        lastMessageBefore: if(is_integer(cursor.before), do: cursor.before)
      }
      |> exclude_nil()

    with {:ok, %Req.Response{body: body}} <-
           Talkjs.fetch(
             :get,
             "users/" <> ShortUUID.decode!(user_id) <> "/conversations",
             nil,
             query: query
           ),
         {:ok, body} <- Jason.decode(body),
         %{"data" => data} when is_list(data) <- body do
      data = data |> decode() |> Enum.reject(&is_nil/1)

      {:ok, {data, Cursor.map(cursor, data)}}
    else
      %{"errorCode" => "LIMIT_OUT_OF_BOUNDS"} ->
        {:error, :invalid_limit}

      reason ->
        log(:error, [:list], reason: reason)
        {:error, :upstream}
    end
  end

  def list_messages(conversation_id, before \\ nil) do
    if Chat.enabled?(),
      do: list_messages_from_chat(conversation_id, before),
      else: list_messages_from_talkjs(conversation_id, before)
  end

  defp list_messages_from_chat(conversation_id, before) do
    with %Chat.Conversation{} = conversation <- Chat.get_conversation(conversation_id),
         {:ok, before} <- before_seq(conversation_id, before) do
      {messages, _} = Chat.list_messages(conversation_id, before: before)

      {:ok,
       messages
       |> Enum.reverse()
       |> Enum.map(&Message.from_chat(&1, conversation.participants))}
    else
      _ -> {:error, :not_found}
    end
  end

  defp before_seq(_, nil), do: {:ok, nil}

  defp before_seq(conversation_id, message_id) do
    case Chat.get_message(conversation_id, message_id) do
      %Chat.Message{seq: seq} -> {:ok, seq}
      nil -> :error
    end
  end

  defp list_messages_from_talkjs(conversation_id, before) do
    query =
      %{
        limit: 30,
        startingAfter: before
      }
      |> exclude_nil()

    with {:ok, %Req.Response{status: 200, body: body}} <-
           Talkjs.fetch(
             :get,
             "conversations/" <> conversation_id <> "/messages",
             nil,
             query: query
           ),
         {:ok, %{"data" => data}} when is_list(data) <- Jason.decode(body) do
      {:ok, Message.decode(data)}
    else
      {:error, :not_configured} ->
        {:ok, []}

      reason ->
        log(:error, [:list_messages], reason: reason)
        {:error, :upstream}
    end
  end

  defimpl Jason.Encoder do
    use Flirtual.Encoder,
      only: [
        :id,
        :subject,
        :kind,
        :user_id,
        :participants,
        :last_message,
        :is_unread,
        :created_at
      ]
  end

  defmodule Policy do
    use Flirtual.Policy

    alias Flirtual.Policy
    alias Flirtual.User
    alias Flirtual.User.Session
    alias Flirtual.Users

    def authorize(
          action,
          %Plug.Conn{
            assigns: %{
              session: %Session{
                user_id: user_id,
                user: %User{} = user
              }
            }
          } = conn,
          %Conversation{participants: participants}
        )
        when action in [:read, :send_message] do
      if Chat.enabled?() do
        action = if action == :send_message, do: :write, else: :read
        match?({:ok, _, _}, Chat.authorize(user, participants, action))
      else
        with true <- user_id in participants,
             [other_id] <- Enum.reject(participants, &(&1 === user_id)),
             %User{} = target <- Users.get(other_id, []) do
          Policy.can?(conn, :read, target)
        else
          _ -> false
        end
      end
    end

    def authorize(_, _, _), do: false

    def transform(
          :user_id,
          %Plug.Conn{
            assigns: %{
              session: %Session{
                user_id: user_id
              }
            }
          },
          %Conversation{participants: participants}
        ) do
      participants
      |> Enum.reject(&(&1 === user_id))
      |> List.first()
    end
  end

  defmodule Message do
    use Flirtual.Schema, primary_key: :id
    use Flirtual.Policy.Target, policy: __MODULE__.Policy

    embedded_schema do
      field :content, :string
      field :sender_id, :binary_id

      field :seen_by, {:array, :binary_id}
      field :system, :boolean
      field :kind, Ecto.Enum, values: [:match]

      field :viewed, :boolean, virtual: true

      timestamps(updated_at: false)
    end

    def decode([]), do: []
    def decode(data) when is_list(data), do: Enum.map(data, &decode(&1))

    def decode(%{} = data) do
      %Message{
        id: data["id"],
        content: data["text"],
        sender_id:
          case data["senderId"] do
            sender_id when is_uuid(sender_id) ->
              ShortUUID.encode!(sender_id)

            _ ->
              nil
          end,
        seen_by: data["readBy"] |> Enum.map(&ShortUUID.encode!/1),
        system: data["type"] === "SystemMessage",
        kind:
          if(data["type"] === "SystemMessage" and data["text"] === Chat.match_message(),
            do: :match
          ),
        created_at: DateTime.from_unix!(data["createdAt"], :millisecond)
      }
    end

    def decode(_), do: nil

    def from_chat(%Flirtual.Chat.Message{} = message, participants) do
      %Message{
        id: message.id,
        content: Flirtual.Chat.text(message),
        sender_id: message.sender_id,
        seen_by:
          participants
          |> Enum.filter(&(&1.last_read_seq >= message.seq))
          |> Enum.map(& &1.user_id),
        system: message.system,
        kind: message.kind,
        created_at: message.created_at
      }
    end

    defimpl Jason.Encoder do
      use Flirtual.Encoder,
        only: [
          :id,
          :content,
          :sender_id,
          :viewed,
          :system,
          :kind,
          :created_at
        ]
    end

    defmodule Policy do
      alias Flirtual.User.Session
      use Flirtual.Policy

      def authorize(:read, _, _), do: false
      def authorize(_, _, _), do: false

      def transform(
            :viewed,
            %Plug.Conn{
              assigns: %{
                session: %Session{
                  user_id: user_id
                }
              }
            },
            %Message{sender_id: user_id}
          ),
          do: true

      def transform(
            :viewed,
            %Plug.Conn{
              assigns: %{
                session: %Session{
                  user_id: user_id
                }
              }
            },
            %Message{seen_by: seen_by}
          ) do
        seen_by
        |> Enum.member?(user_id)
      end
    end
  end
end

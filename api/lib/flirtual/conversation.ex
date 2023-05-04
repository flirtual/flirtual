defmodule Flirtual.Conversation do
  use Flirtual.Schema, primary_key: :id
  use Flirtual.Policy.Target, policy: Flirtual.Conversation.Policy
  use Flirtual.Logger, :conversation

  require Flirtual.Utilities
  import Flirtual.Utilities

  alias Flirtual.Conversation.Cursor
  alias Flirtual.Conversation.Message
  alias Flirtual.Conversation
  alias Flirtual.Talkjs
  alias Flirtual.User.Profile.LikesAndPasses

  embedded_schema do
    field :subject, :string
    field :kind, Ecto.Enum, values: Ecto.Enum.values(LikesAndPasses, :kind)

    field :participants, {:array, :binary_id}
    field :last_message, :map

    field :user_id, :binary_id, virtual: true

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

  defp decode(%{} = data) do
    %Conversation{
      id: data["id"],
      kind: decode(:subject, data["subject"]),
      participants: data["participants"] |> Map.keys(),
      last_message: data["lastMessage"] |> Message.decode(),
      created_at: DateTime.from_unix!(data["createdAt"], :millisecond)
    }
  end

  defmodule Cursor do
    import Flirtual.Utilities

    @derive [{Jason.Encoder, only: [:page, :limit]}]
    defstruct before: nil, last_before: nil, page: 0, limit: 10

    def map(self, data) do
      %{
        previous: self |> previous(data) |> encode(),
        next: self |> next(data) |> encode(),
        self: self
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

    def decode(token) when is_binary(token) do
      with {:ok, binary} <- Base.url_decode64(token),
           {
             last_before,
             before,
             page,
             limit
           }
           when (is_nil(last_before) or is_integer(last_before)) and
                  (is_nil(before) or is_integer(before)) and is_integer(page) and
                  is_integer(limit) <-
             :erlang.binary_to_term(binary) do
        %Cursor{
          before: before,
          last_before: last_before,
          page: page,
          limit: limit
        }
      else
        _ -> first()
      end
    end

    def decode(_), do: first()

    def next(_, []), do: nil

    def next(%Cursor{} = self, data) do
      if length(data) == self.limit do
        %Cursor{
          before:
            data
            |> List.last()
            |> Access.get(:last_message)
            |> Access.get(:created_at)
            |> DateTime.to_unix(:millisecond),
          last_before: self.before,
          page: self.page + 1
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
        page: self.page - 1
      }
    end
  end

  def list(user_id, token \\ nil) do
    cursor = Cursor.decode(token)

    query =
      %{
        limit: cursor.limit,
        lastMessageBefore: cursor.before
      }
      |> exclude_nil()

    with {:ok, %HTTPoison.Response{body: body}} <-
           Talkjs.fetch(
             :get,
             "users/" <> user_id <> "/conversations",
             nil,
             query: query
           ),
         {:ok, body} <- Poison.decode(body),
         %{"data" => data} when is_list(data) <- body do
      data = data |> decode()

      {:ok,
       {data,
        %{
          cursor: Cursor.map(cursor, data),
          total: length(data)
        }}}
    else
      %{"errorCode" => "LIMIT_OUT_OF_BOUNDS"} ->
        {:error, :invalid_limit}

      reason ->
        log(:error, [:list], reason: reason)
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
        :last_message,
        :created_at
      ]
  end

  defmodule Policy do
    use Flirtual.Policy

    alias Flirtual.Policy
    alias Flirtual.User.Session

    def authorize(:read, _, _), do: false
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

      field :viewed, :boolean, virtual: true

      timestamps(updated_at: false)
    end

    def decode([]), do: []
    def decode(data) when is_list(data), do: Enum.map(data, &decode(&1))

    def decode(%{} = data) do
      %Message{
        id: data["id"],
        content: data["text"],
        sender_id: data["senderId"],
        seen_by: data["readBy"],
        system: data["type"] === "SystemMessage",
        created_at: DateTime.from_unix!(data["createdAt"], :millisecond)
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

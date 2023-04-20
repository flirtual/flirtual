defmodule Flirtual.Conversation do
  use Flirtual.Schema, primary_key: :id
  use Flirtual.Policy.Target, policy: Flirtual.Conversation.Policy

  require Flirtual.Utilities

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

  defp encode(:kind, :love), do: "❤️"
  defp encode(:kind, :friend), do: "✌️"

  defp decode(:subject, "❤️"), do: :love
  defp decode(:subject, "✌️"), do: :friend

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

  def list(user_id: user_id) do
    case Talkjs.fetch(:get, "users/" <> user_id <> "/conversations", nil) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        Poison.decode!(body)["data"] |> decode()
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

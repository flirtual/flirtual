defmodule Flirtual.Talkjs do
  use Flirtual.Logger, :talkjs

  require Flirtual.Utilities
  import Flirtual.Utilities

  alias Flirtual.User

  defp config(key) do
    Application.get_env(:flirtual, Flirtual.Talkjs)[key]
  end

  def new_url(pathname, query) do
    URI.parse("https://api.talkjs.com/v1/" <> config(:app_id) <> "/" <> pathname)
    |> then(&if(is_nil(query), do: &1, else: Map.put(&1, :query, URI.encode_query(query))))
    |> URI.to_string()
  end

  def new_conversation_id(%User{} = user_a, %User{} = user_b),
    do: new_conversation_id(user_a.id, user_b.id)

  def new_conversation_id(user_id, target_user_id)
      when is_binary(user_id) and is_binary(target_user_id) do
    Enum.sort([
      user_id,
      target_user_id
    ])
    |> Poison.encode!()
    |> then(&:crypto.hash(:sha, &1))
    |> Base.encode16(case: :lower)
    |> String.slice(0, 20)
  end

  def new_user_signature(user_id) do
    :crypto.mac(:hmac, :sha256, config(:access_token), ShortUUID.decode!(user_id))
    |> Base.encode16(case: :lower)
  end

  def fetch(method, pathname, body \\ nil, options \\ []) do
    raw_body = if(is_nil(body), do: "", else: Poison.encode!(body))
    url = new_url(pathname, Keyword.get(options, :query))

    log(:debug, [method, url], body)

    HTTPoison.request(method, url, raw_body, [
      {"authorization", "Bearer " <> config(:access_token)},
      {"content-type", "application/json"}
    ])
  end

  def batch(operations) when length(operations) > 10 do
    with true <-
           Enum.all?(
             operations
             |> Enum.chunk_every(10)
             |> Enum.map(fn chunk ->
               %{"operations" => chunk}
               |> Flirtual.ObanWorkers.TalkjsBatch.new()
               |> Oban.insert()
             end),
             &match?({:ok, _}, &1)
           ) do
      {:ok, length(operations)}
    else
      _ ->
        :error
    end
  end

  def batch(operations) do
    case fetch(:post, "batch", operations) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        {:ok, Poison.decode!(body)}
    end
  end

  def update_user(%User{} = user) do
    update_user(user.id, %{
      name: User.display_name(user),
      email: if(user.preferences.email_notifications.messages, do: [user.email], else: []),
      photoUrl: User.avatar_url(user, "icon"),
      role: "user"
    })
  end

  def delete_user(%User{} = user) do
    with {:ok, talkjs_user} <-
           update_user(user.id, %{
             name: User.display_name(user, deleted: true),
             email: nil,
             photoUrl: nil,
             role: nil
           }),
         {:ok, _} <- delete_user_conversations(user.id) do
      {:ok, talkjs_user}
    end
  end

  def delete_user_conversations(user_id, options \\ []) when is_uid(user_id) do
    soft = Keyword.get(options, :soft, false)

    list_conversations(user_id)
    |> Enum.map(
      &if soft do
        &1.participants
        |> Map.keys()
        |> Enum.map(fn participant_id ->
          delete_participant(&1["id"], participant_id)
        end)
      else
        delete_conversation(&1["id"])
      end
    )
    |> then(
      &Enum.reduce(&1, {:ok, length(&1)}, fn item, _ ->
        case item do
          {:error, _} -> item
          {:ok, _} -> {:ok, length(&1)}
        end
      end)
    )
  end

  def update_user(user_id, params) do
    case fetch(:put, "users/" <> ShortUUID.decode!(user_id), params) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        {:ok, Poison.decode!(body)}

      _ ->
        :error
    end
  end

  def update_conversation(conversation_id, data) do
    case fetch(:put, "conversations/" <> conversation_id, data) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        {:ok, Poison.decode!(body)}
    end
  end

  def delete_participants(user_id: user_id, target_id: target_id)
      when is_uid(user_id) and is_uid(target_id) do
    conversation_id = new_conversation_id(user_id, target_id)

    with {:ok, _} <- delete_participant(conversation_id, user_id),
         {:ok, _} <- delete_participant(conversation_id, target_id) do
      {:ok, nil}
    end
  end

  def delete_participant(conversation_id, user_id) do
    case fetch(
           :delete,
           "conversations/" <> conversation_id <> "/participants/" <> ShortUUID.decode!(user_id)
         ) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        {:ok, Poison.decode!(body)}

      {:ok, %HTTPoison.Response{status_code: 404, body: body}} ->
        {:ok, Poison.decode!(body)}
    end
  end

  def delete_conversation(conversation_id) do
    case fetch(:delete, "conversations/" <> conversation_id) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        {:ok, Poison.decode!(body)}

      {:ok, %HTTPoison.Response{status_code: 404, body: body}} ->
        {:ok, Poison.decode!(body)}
    end
  end

  def create_messages(conversation_id, messages) do
    case fetch(:post, "conversations/" <> conversation_id <> "/messages", messages) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        {:ok, Poison.decode!(body)}
    end
  end

  def list_conversations(user_id, options \\ []) do
    case fetch(:get, "users/" <> ShortUUID.decode!(user_id) <> "/conversations", nil,
           query: options
         ) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        Poison.decode!(body)["data"]
    end
  end

  def mark_conversations_read(user_id) when is_uid(user_id) do
    participant_id = ShortUUID.decode!(user_id)

    list_conversations(user_id, %{"limit" => 100, "unreadsOnly" => true})
    |> Enum.with_index()
    |> Enum.map(fn {conversation, index} ->
      [index, "POST", "/conversations/" <> conversation["id"] <> "/readBy/" <> participant_id]
    end)
    |> batch()
  end

  def list_messages(conversation_id, options \\ []) do
    case fetch(:get, "conversations/" <> conversation_id <> "/messages", nil, query: options) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        Poison.decode!(body)["data"]
    end
  end
end

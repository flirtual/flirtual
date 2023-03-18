defmodule Flirtual.Talkjs do
  use Flirtual.Logger, :talkjs

  alias Flirtual.{User}

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
    Enum.sort([user_id, target_user_id])
    |> Poison.encode!()
    |> then(&:crypto.hash(:sha, &1))
    |> Base.encode16(case: :lower)
    |> String.slice(0, 20)
  end

  def new_user_signature(user_id) do
    :crypto.mac(:hmac, :sha256, config(:access_token), user_id)
    |> Base.encode16(case: :lower)
  end

  def fetch(method, pathname, body \\ nil, options \\ []) do
    raw_body = if(is_nil(body), do: "", else: Poison.encode!(body))
    url = new_url(pathname, Keyword.get(options, :query))

    log(:info, [method, url], body)

    result =
      HTTPoison.request(method, url, raw_body, [
        {"authorization", "Bearer " <> config(:access_token)},
        {"content-type", "application/json"}
      ])

    log(:info, [method, url], result)
    result
  end

  def update_user(%User{} = user) do
    update_user(user.id, %{
      name: user.profile.display_name || user.username,
      email: if(user.preferences.email_notifications.messages, do: [user.email], else: []),
      photoUrl: User.avatar_url(user),
      role: "user"
    })
  end

  def update_user(user_id, params) do
    case fetch(:put, "users/" <> user_id, params) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        {:ok, Poison.decode!(body)}

      _ ->
        :error
    end
  end

  def update_conversation(conversation_id, participant_ids, subject, welcome_messages \\ []) do
    case fetch(:put, "conversations/" <> conversation_id, %{
           participants: participant_ids,
           subject: subject,
           welcomeMessages: welcome_messages
         }) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        {:ok, Poison.decode!(body)}
    end
  end

  def create_messages(conversation_id, messages) do
    case fetch(:post, "conversations/" <> conversation_id <> "/messages", messages) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        {:ok, Poison.decode!(body)}
    end
  end

  def list_conversations() do
    case fetch(:get, "conversations") do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        Poison.decode!(body)["data"]
    end
  end

  def list_conversations(user_id, options \\ []) do
    case fetch(:get, "users/" <> user_id <> "/conversations", nil, query: options) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        Poison.decode!(body)["data"]
    end
  end

  def list_messages(conversation_id, options \\ []) do
    case fetch(:get, "conversations/" <> conversation_id <> "/messages", nil, query: options) do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        Poison.decode!(body)["data"]
    end
  end
end

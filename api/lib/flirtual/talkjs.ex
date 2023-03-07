defmodule Flirtual.Talkjs do
  @app_id Application.fetch_env!(:flirtual, :talkjs_app_id)
  @access_token Application.fetch_env!(:flirtual, :talkjs_access_token)

  @base_url "https://api.talkjs.com/v1/" <> @app_id

  def new_url(pathname, query) do
    URI.parse(@base_url <> "/" <> pathname)
    |> then(&if(is_nil(query), do: &1, else: Map.put(&1, :query, URI.encode_query(query))))
    |> URI.to_string()
  end

  def new_conversation_id(user_id, target_user_id) do
    Enum.sort([user_id, target_user_id])
    |> Poison.encode!()
    |> then(&:crypto.hash(:sha, &1))
    |> Base.encode16(case: :lower)
    |> String.slice(0, 20)
  end

  def fetch(method, pathname, body \\ nil, options \\ []) do
    body = if(is_nil(body), do: "", else: Poison.encode!(body))
    url = new_url(pathname, Keyword.get(options, :query))

    IO.inspect(url)

    HTTPoison.request(method, url, body, [
      {:authorization, "Bearer " <> @access_token}
    ])
  end

  def list_conversations() do
    case fetch(:get, "conversations") do
      {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
        Poison.decode!(body)["data"]
    end
  end

  def list_conversations(user_id, options \\ []) do
    case fetch(:get, "users/" <> user_id <> "/conversations", nil, [query: options]) do
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

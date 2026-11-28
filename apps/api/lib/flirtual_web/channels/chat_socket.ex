defmodule FlirtualWeb.ChatSocket do
  use Phoenix.Socket

  alias Flirtual.{Chat, User, Users}

  @token_salt "chat"
  @token_max_age 60 * 60

  channel("user:*", FlirtualWeb.UserChannel)
  channel("conversation:*", FlirtualWeb.ConversationChannel)

  def token(%User{id: user_id}),
    do: Phoenix.Token.sign(FlirtualWeb.Endpoint, @token_salt, user_id)

  def token_max_age, do: @token_max_age

  @impl true
  def connect(%{"token" => token}, socket, _connect_info) when is_binary(token) do
    with true <- Chat.enabled?(),
         {:ok, user_id} <-
           Phoenix.Token.verify(FlirtualWeb.Endpoint, @token_salt, token, max_age: @token_max_age),
         %User{banned_at: nil, deactivated_at: nil} <- Users.get(user_id, []) do
      {:ok, assign(socket, :user_id, user_id)}
    else
      _ -> :error
    end
  end

  def connect(_, _, _), do: :error

  @impl true
  def id(socket), do: Chat.socket_id(socket.assigns.user_id)

  def allowed_origin?(%URI{} = uri) do
    origin =
      %URI{scheme: uri.scheme, host: uri.host, port: uri.port}
      |> URI.to_string()
      |> String.downcase()

    origin in FlirtualWeb.Endpoint.get_origins()
  end
end

defmodule Flirtual.VRChat do
  use Flirtual.Connection.Provider, :vrchat

  alias Flirtual.Connection

  def profile_avatar_url(%Connection{avatar: avatar}),
    do: "https://api.vrchat.cloud/api/1/file/#{avatar}/1/"

  def profile_url(%Connection{uid: id}), do: "https://vrchat.com/home/user/#{id}"

  def with_vrchat_api(api_call_fn) do
    case Flirtual.VRChatSession.get_connection() do
      {:ok, vrchat_conn} ->
        case api_call_fn.(vrchat_conn) do
          {:error, %{status: 401}} ->
            # Session expired, invalidate and retry
            Flirtual.VRChatSession.invalidate_session()

            case Flirtual.VRChatSession.get_connection() do
              {:ok, new_conn} ->
                api_call_fn.(new_conn)

              {:error, reason} ->
                {:error, reason}
            end

          other ->
            other
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  @character_map %{
    "@" => "＠",
    "#" => "＃",
    "$" => "＄",
    "%" => "％",
    "&" => "＆",
    "=" => "＝",
    "+" => "＋",
    "/" => "⁄",
    "\\" => "＼",
    ";" => ";",
    ":" => "˸",
    "," => "‚",
    "?" => "?",
    "!" => "ǃ",
    ~c"\"" => "＂",
    "<" => "≺",
    ">" => "≻",
    "." => "․",
    "^" => "＾",
    "{" => "｛",
    "}" => "｝",
    "[" => "［",
    "]" => "］",
    "(" => "（",
    ")" => "）",
    "|" => "｜",
    "*" => "∗"
  }

  def escape(value) do
    value
    |> String.replace(~r/.{1}/, fn char ->
      case Map.get(@character_map, char) do
        nil -> char
        escaped -> escaped
      end
    end)
  end

  def resolve_input(input) when is_binary(input) do
    IO.inspect("Resolving vrchat input")
    case classify_input(input) do
      {:user_id, user_id} ->
        IO.inspect("Resolved to user ID: #{user_id}")
        resolve_by_user_id(user_id)

      {:profile_link, user_id} ->
        IO.inspect("Resolved to profile link: #{user_id}")
        resolve_by_user_id(user_id)

      {:display_name, display_name} ->
        IO.inspect("Resolved to display name: #{display_name}")
        resolve_by_display_name(display_name)
    end
  end

  def resolve_input(_), do: {:error, :invalid_input}

  def classify_input("usr_" <> _ = input) do
    # Most common user ID format: usr_<uuid>
    if Regex.match?(~r/^usr_[a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12}$/i, input) do
      {:user_id, normalize_user_id(input)}
    else
      {:display_name, input}
    end
  end

  def classify_input(input) when is_binary(input) do
    cond do
      # Direct profile link: https://vrchat.com/home/user/usr_...
      Regex.match?(~r/^https?:\/\/vrchat\.com\/home\/user\/([^\/?\#]+)$/i, input) ->
        case Regex.run(~r/^https?:\/\/vrchat\.com\/home\/user\/([^\/?\#]+)$/i, input) do
          [_, user_id] -> {:profile_link, user_id}
          _ -> {:display_name, input}
        end

      # Search link: https://vrchat.com/home/search/displayname
      Regex.match?(~r/^https?:\/\/vrchat\.com\/home\/search\/([^\/?\#]+)$/i, input) ->
        case Regex.run(~r/^https?:\/\/vrchat\.com\/home\/search\/([^\/?\#]+)$/i, input) do
          [_, display_name] -> {:display_name, URI.decode(display_name)}
          _ -> {:display_name, input}
        end

      true ->
        {:display_name, input}
    end
  end

  # Fix user IDs with missing hyphens
  defp normalize_user_id("usr_" <> rest) do
    clean = String.replace(rest, "-", "")
    if String.length(clean) == 32 do
      "usr_#{String.slice(clean, 0, 8)}-#{String.slice(clean, 8, 4)}-#{String.slice(clean, 12, 4)}-#{String.slice(clean, 16, 4)}-#{String.slice(clean, 20, 12)}"
    else
      "usr_#{rest}"
    end
  end

  defp resolve_by_user_id(user_id) do
    case with_vrchat_api(fn conn -> VRChat.Users.get_user(conn, user_id, []) end) do
      {:ok, user} ->
        {:ok, %{id: user.id, display_name: user.displayName}}

      {:error, _} ->
        {:error, :not_found}
    end
  end

  defp resolve_by_display_name(display_name) do
    escaped_name = escape(display_name)

    case with_vrchat_api(fn conn -> VRChat.Users.search_users(conn, search: escaped_name) end) do
      {:ok, users} ->
        case Enum.find(users, fn user -> user.displayName == escaped_name end) do
          %{id: id, displayName: display_name} ->
            {:ok, %{id: id, display_name: display_name}}

          nil ->
            {:error, :not_found}
        end

      {:error, _} ->
        {:error, :api_error}
    end
  end
end

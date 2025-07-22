defmodule Flirtual.VRChat do
  use Flirtual.Connection.Provider, :vrchat

  alias Flirtual.Connection

  def profile_avatar_url(%Connection{avatar: avatar}),
    do: "https://api.vrchat.cloud/api/1/file/#{avatar}/1/"

  def profile_url(%Connection{uid: id}), do: "https://vrchat.com/home/user/#{id}"

  def with_session(api_call_fn) do
    case Flirtual.VRChatSession.get_connection() do
      {:ok, vrchat_conn} ->
        case api_call_fn.(vrchat_conn) do
          {:ok, %{error: %{status_code: 401}}} ->
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

  def get_worlds_by_category(_, _, params \\ %{})

  def get_worlds_by_category(vrchat, "recommended", params) do
    vrchat
    |> VRChat.Worlds.get_favorited_worlds(
      params
      |> Keyword.merge(tag: "worlds1")
    )
  end

  def get_worlds_by_category(vrchat, "spotlight", params) do
    vrchat
    |> VRChat.Worlds.search_worlds(
      params
      |> Keyword.merge(
        sort: "publicationDate",
        tag: "admin_spotlight_xplat"
      )
    )
  end

  def get_worlds_by_category(vrchat, "active", params) do
    vrchat
    |> VRChat.Worlds.get_active_worlds(
      params
      |> Keyword.merge(notag: ["author_tag_game", "admin_spotlight_xplat"])
    )
  end

  def get_worlds_by_category(vrchat, "games", params) do
    vrchat
    |> VRChat.Worlds.get_active_worlds(
      params
      |> Keyword.merge(
        tag: "author_tag_game",
        notag: "admin_spotlight_xplat"
      )
    )
  end

  def get_worlds_by_category(vrchat, "new", params) do
    vrchat
    |> VRChat.Worlds.search_worlds(
      params
      |> Keyword.merge(
        sort: "hotness",
        tag: "system_published_recently",
        notag: "admin_spotlight_xplat"
      )
    )
  end

  def get_worlds_by_category(vrchat, "random", params) do
    vrchat
    |> VRChat.Worlds.search_worlds(
      params
      |> Keyword.merge(
        sort: "shuffle",
        notag: "admin_spotlight_xplat"
      )
    )
  end

  @character_map %{
    ~c"@" => ~c"＠",
    ~c"#" => ~c"＃",
    ~c"$" => ~c"＄",
    ~c"%" => ~c"％",
    ~c"&" => ~c"＆",
    ~c"=" => ~c"＝",
    ~c"+" => ~c"＋",
    ~c"/" => ~c"⁄",
    ~c"\\" => ~c"＼",
    ~c";" => ~c";",
    ~c":" => ~c"˸",
    ~c"," => ~c"‚",
    ~c"?" => ~c"?",
    ~c"!" => ~c"ǃ",
    ~c"\"" => ~c"＂",
    ~c"<" => ~c"≺",
    ~c">" => ~c"≻",
    ~c"." => ~c"․",
    ~c"^" => ~c"＾",
    ~c"{" => ~c"｛",
    ~c"}" => ~c"｝",
    ~c"[" => ~c"［",
    ~c"]" => ~c"］",
    ~c"(" => ~c"（",
    ~c")" => ~c"）",
    ~c"|" => ~c"｜",
    ~c"*" => ~c"∗"
  }

  @reverse_character_map Map.new(@character_map, fn {k, v} -> {v, k} end)

  def escape(value) do
    value
    |> String.split("")
    |> Enum.map(fn char ->
      case Map.get(@character_map, String.to_charlist(char)) do
        nil -> char
        escaped -> escaped
      end
    end)
    |> Enum.join("")
  end

  def unescape(value) do
    value
    |> String.split("")
    |> Enum.map(fn char ->
      case Map.get(@reverse_character_map, String.to_charlist(char)) do
        nil -> char
        unescaped -> unescaped
      end
    end)
    |> Enum.join("")
  end

  def resolve_input(input) when is_binary(input) do
    case classify_input(input) do
      {:user_id, user_id} ->
        resolve_by_user_id(user_id)

      {:profile_link, user_id} ->
        resolve_by_user_id(user_id)

      {:display_name, display_name} ->
        resolve_by_display_name(display_name)
    end
  end

  def resolve_input(_), do: {:error, :invalid_input}

  def classify_input("usr_" <> _ = input) do
    # Most common user ID format: usr_<uuid>
    if Regex.match?(
         ~r/^usr_[a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12}$/i,
         input
       ) do
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

      # Search link: https://vrchat.com/home/search[/users]/displayname
      Regex.match?(~r/^https?:\/\/vrchat\.com\/home\/search\/(?:users\/)?([^\/?\#]+)$/i, input) ->
        case Regex.run(
               ~r/^https?:\/\/vrchat\.com\/home\/search\/(?:users\/)?([^\/?\#]+)$/i,
               input
             ) do
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
    case with_session(fn conn -> VRChat.Users.get_user(conn, user_id, []) end) do
      {:ok, user} ->
        {:ok, %{id: user.id, display_name: user.displayName}}

      {:error, _} ->
        {:error, :not_found}
    end
  end

  defp resolve_by_display_name(display_name) do
    escaped_name = escape(display_name)

    case with_session(&VRChat.Users.search_users(&1, search: escaped_name)) do
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

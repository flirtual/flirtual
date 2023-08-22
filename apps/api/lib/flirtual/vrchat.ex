defmodule Flirtual.VRChat do
  use Flirtual.Connection.Provider, :vrchat

  alias Flirtual.Connection

  def profile_avatar_url(%Connection{avatar: avatar}),
    do: "https://api.vrchat.cloud/api/1/file/#{avatar}/1/"

  def profile_url(%Connection{uid: id}), do: "https://vrchat.com/home/user/#{id}"

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
end

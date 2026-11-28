defmodule Flirtual.Chat.LinksTest do
  use ExUnit.Case, async: false

  alias Flirtual.Chat.Links

  @blocked "(Unknown link blocked)"

  setup do
    Links.use_tlds(~w(com net org uk io zone be at gg))
  end

  test "keeps a link to an allowed host" do
    text = "watch https://www.youtube.com/watch?v=dQw4w9WgXcQ later"
    assert Links.mask(text) == text
  end

  test "keeps a subdomain of a wildcard host" do
    assert Links.mask("https://hello.vrchat.com/") == "https://hello.vrchat.com/"
  end

  test "masks a link to any other host" do
    assert Links.mask("see https://evil.example.com/login now") == "see #{@blocked} now"
  end

  test "masks a bare domain with no scheme" do
    assert Links.mask("add me on evil.com") == "add me on #{@blocked}"
  end

  @cases [
    {"hello there", []},
    {"see https://youtu.be/x.", ["https://youtu.be/x"]},
    {"HTTPS://EVIL.COM/a now", ["HTTPS://EVIL.COM/a"]},
    {"www.evil.zone and evil.com/path?x=1", ["www.evil.zone", "evil.com/path?x=1"]},
    {"is it evil.com?", ["evil.com"]},
    {"sub.evil.co.uk/a", ["sub.evil.co.uk/a"]},
    {"https://youtu.be/a_b_c", ["https://youtu.be/a_b_c"]},
    {"someone@evil.com, e.g. tomorrow... ok", []},
    {"/evil.com .evil.com -evil.com _evil.com", []},
    {"evil.notatld evil.nope/login evil.com_", []},
    {"<https://evil.com> [x](https://evil.com)", ["https://evil.com", "https://evil.com"]},
    {"https://youtube.com@evil.com/x", ["https://youtube.com@evil.com/x"]},
    {"\u{898B}\u{3066}evil.com", ["evil.com"]},
    {"\u{E9}vil.com\u{65E5}\u{672C}", ["vil.com"]},
    {"ex\u{E4}mple.com", ["mple.com"]},
    {"\u{212A}ick.com evil.com\u{212A}", ["\u{212A}ick.com"]},
    {"\u{17F}evil.com evil.co\u{17F}", ["\u{17F}evil.com"]},
    {"https://youtube.com\u{85}@evil.com/", ["https://youtube.com"]},
    {"https://youtube.com\u{180E}@evil.com/", ["https://youtube.com"]},
    {"https://youtube.com\u{FEFF}@evil.com/", ["https://youtube.com"]},
    {"https://youtube.com\u{200B}@evil.com/", ["https://youtube.com\u{200B}@evil.com/"]},
    {"https://evil.com\u{3000}next", ["https://evil.com"]}
  ]

  test "finds links where they start and end" do
    for {text, links} <- @cases do
      found =
        Links.link_regex()
        |> Regex.scan(text)
        |> Enum.map(&(&1 |> hd() |> Links.trim()))
        |> Enum.reject(&(&1 == ""))

      assert found == links, "links in #{inspect(text)}"
    end
  end

  test "reports where the allowed links are in the masked text" do
    text = "😀 see evil.com, then vrchat.com/home. 見てhttps://youtu.be/x"
    {masked, links} = Links.render(text)

    assert masked == "😀 see #{@blocked}, then vrchat.com/home. 見てhttps://youtu.be/x"

    units =
      masked
      |> :unicode.characters_to_binary(:utf8, {:utf16, :big})
      |> then(&for(<<unit::16 <- &1>>, do: unit))

    slice = fn %{start: start, length: length} ->
      units
      |> Enum.slice(start, length)
      |> Enum.flat_map(&[<<&1::16>>])
      |> IO.iodata_to_binary()
      |> :unicode.characters_to_binary({:utf16, :big}, :utf8)
    end

    assert Enum.map(links, slice) == ["vrchat.com/home", "https://youtu.be/x"]
  end

  test "leaves a blocked link readable but unlinked for a moderator" do
    assert Links.render("evil.com and vrchat.com", unmasked: true) ==
             {"evil.com and vrchat.com", [%{start: 13, length: 10}]}
  end

  test "treats any ending as a domain until the list has loaded" do
    regex = :persistent_term.get({Links, :link})
    :persistent_term.erase({Links, :link})
    on_exit(fn -> :persistent_term.put({Links, :link}, regex) end)

    assert Links.mask("evil.notatld") == @blocked
  end

  test "masks a two-letter top-level domain" do
    assert Links.mask("evil.io/path?x=1") == @blocked
  end

  test "keeps the punctuation that follows a masked link" do
    assert Links.mask("is it evil.com?") == "is it #{@blocked}?"
  end

  test "does not treat an allowed host as a prefix" do
    assert Links.mask("https://youtube.com.evil.com/") == @blocked
  end

  test "does not treat an allowed host inside the path as allowed" do
    assert Links.mask("https://evil.com/youtube.com") == @blocked
  end

  test "ignores user info in front of the real host" do
    assert Links.mask("https://youtube.com@evil.com/") == @blocked
  end

  test "keeps an exact suppression exception and masks its neighbours" do
    assert Links.mask("https://forms.gle/SqMKyKBwhTFNNuPw8") ==
             "https://forms.gle/SqMKyKBwhTFNNuPw8"

    assert Links.mask("https://forms.gle/other") == @blocked
  end

  test "leaves an email address and ordinary text alone" do
    text = "mail someone@evil.com, e.g. tomorrow... ok"
    assert Links.mask(text) == text
  end

  test "masks every link in a message" do
    assert Links.mask("a.com and https://youtu.be/x and b.net") ==
             "#{@blocked} and https://youtu.be/x and #{@blocked}"
  end

  test "passes nil through" do
    assert Links.mask(nil) == nil
  end
end

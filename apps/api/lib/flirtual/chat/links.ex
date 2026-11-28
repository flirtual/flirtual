defmodule Flirtual.Chat.Links do
  import Flirtual.Utilities, only: [utf16_length: 1]

  @hosts_path Application.app_dir(:flirtual, "priv/chat/allowed-hosts.json")
  @matches_path Application.app_dir(:flirtual, "priv/chat/allowed-matches.json")
  @external_resource @hosts_path
  @external_resource @matches_path

  @replacement "(Unknown link blocked)"

  @url_character "[^\\s<>\\x{85}\\x{180E}\\x{FEFF}]"
  @any_tld "[a-z]{2,}"

  defp link_source(tlds) do
    "(?:https?://|www\\.)#{@url_character}+|(?<![a-z0-9_@.\\-/])(?:[a-z0-9](?:[a-z0-9\\-]*[a-z0-9])?\\.)+(?:#{tlds})(?![a-z0-9_\\-])(?:[/?#]#{@url_character}*)?"
  end

  @hosts @hosts_path
         |> File.read!()
         |> Jason.decode!()
         |> Enum.map(fn host ->
           host
           |> String.downcase()
           |> String.split("*")
           |> Enum.map_join("[a-z0-9.-]*", &Regex.escape/1)
           |> then(&"^#{&1}$")
         end)

  @matches @matches_path
           |> File.read!()
           |> Jason.decode!()
           |> Enum.map(fn literal ->
             [_, source, flags] = Regex.run(~r/^\/(.*)\/([a-z]*)$/s, literal)
             {source, flags}
           end)

  def use_tlds(tlds) when is_list(tlds) do
    pattern =
      tlds
      |> Enum.sort_by(&(-byte_size(&1)))
      |> Enum.map_join("|", &Regex.escape/1)

    :persistent_term.put({__MODULE__, :link}, Regex.compile!(link_source(pattern), "iu"))
  end

  def link_regex do
    with nil <- :persistent_term.get({__MODULE__, :link}, nil),
         nil <- :persistent_term.get({__MODULE__, :any_tld}, nil) do
      regex = Regex.compile!(link_source(@any_tld), "iu")
      :persistent_term.put({__MODULE__, :any_tld}, regex)
      regex
    end
  end

  defp host_regexes do
    with nil <- :persistent_term.get({__MODULE__, :hosts}, nil) do
      regexes = Enum.map(@hosts, &Regex.compile!/1)
      :persistent_term.put({__MODULE__, :hosts}, regexes)
      regexes
    end
  end

  defp match_regexes do
    with nil <- :persistent_term.get({__MODULE__, :matches}, nil) do
      regexes =
        Enum.map(@matches, fn {source, flags} ->
          Regex.compile!(source, String.replace(flags, ~r/[^imsu]/, ""))
        end)

      :persistent_term.put({__MODULE__, :matches}, regexes)
      regexes
    end
  end

  def trim(link), do: String.replace(link, ~r/[.,!?;:'")\]]+$/, "")

  def href(link) do
    if String.match?(link, ~r/^https?:\/\//i), do: link, else: "https://" <> link
  end

  def allowed?(link) do
    href = href(link)

    case URI.new(href) do
      {:ok, %URI{scheme: scheme, host: host}}
      when scheme in ["http", "https"] and is_binary(host) ->
        host = host |> String.downcase() |> String.trim_trailing(".")

        Enum.any?(host_regexes(), &Regex.match?(&1, host)) or
          Enum.any?(match_regexes(), &Regex.match?(&1, href))

      _ ->
        false
    end
  end

  def render(text, options \\ []) when is_binary(text) do
    unmasked? = Keyword.get(options, :unmasked, false)

    {output, links, position, _} =
      link_regex()
      |> Regex.scan(text, return: :index)
      |> Enum.reduce({[], [], 0, 0}, fn [{start, size} | _], {output, links, position, offset} ->
        before = binary_part(text, position, start - position)
        match = binary_part(text, start, size)
        link = trim(match)
        trailing = binary_part(match, byte_size(link), size - byte_size(link))
        offset = offset + utf16_length(before)

        {shown, links} =
          cond do
            allowed?(link) -> {link, [%{start: offset, length: utf16_length(link)} | links]}
            unmasked? -> {link, links}
            true -> {@replacement, links}
          end

        {[output, before, shown, trailing], links, start + size,
         offset + utf16_length(shown) + utf16_length(trailing)}
      end)

    tail = binary_part(text, position, byte_size(text) - position)
    {IO.iodata_to_binary([output, tail]), Enum.reverse(links)}
  end

  def mask(text) when is_binary(text), do: text |> render() |> elem(0)
  def mask(nil), do: nil
end

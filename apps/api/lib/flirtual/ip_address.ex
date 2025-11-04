defmodule Flirtual.IpAddress do
  def normalize(ip_string) when is_binary(ip_string) do
    case parse(ip_string) do
      {:ok, :ipv4, _} -> ip_string
      {:ok, :ipv6, parts} -> normalize_ipv6_to_48(parts)
      {:error, _} -> ip_string
    end
  end

  def anonymize(ip_string) when is_binary(ip_string) do
    case parse(ip_string) do
      {:ok, :ipv4, _} -> anonymize_ipv4(ip_string)
      {:ok, :ipv6, parts} -> anonymize_ipv6(parts)
      {:error, _} -> ip_string
    end
  end

  defp parse(ip_string) do
    case ip_string |> String.to_charlist() |> :inet.parse_ipv4_address() do
      {:ok, {a, b, c, d}} ->
        {:ok, :ipv4, [a, b, c, d]}

      {:error, _} ->
        case ip_string |> String.to_charlist() |> :inet.parse_ipv6_address() do
          {:ok, {a, b, c, d, e, f, g, h}} ->
            {:ok, :ipv6, [a, b, c, d, e, f, g, h]}

          {:error, reason} ->
            {:error, reason}
        end
    end
  end

  defp normalize_ipv6_to_48([a, b, c, _d, _e, _f, _g, _h]) do
    parts =
      [a, b, c]
      |> Enum.map(&Integer.to_string(&1, 16))
      |> Enum.map(&String.downcase/1)

    Enum.join(parts, ":") <> "::"
  end

  defp anonymize_ipv4(ip_string) do
    case String.split(ip_string, ".") do
      [_oct1, _oct2, oct3, oct4] -> "xxx.xxx.#{oct3}.#{oct4}"
      _ -> ip_string
    end
  end

  defp anonymize_ipv6([_a, _b, c, d, _e, _f, _g, h]) do
    anonymized_routing = Integer.to_string(c, 16) |> String.downcase()
    subnet = Integer.to_string(d, 16) |> String.downcase()
    anonymized_interface = Integer.to_string(h, 16) |> String.downcase()

    "xxxx:xxxx:#{anonymized_routing}:#{subnet}:xxxx:xxxx:xxxx:#{anonymized_interface}"
  end
end

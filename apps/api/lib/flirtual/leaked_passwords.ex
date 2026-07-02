defmodule Flirtual.LeakedPasswords do
  def leaked?(password) when is_binary(password) and byte_size(password) > 0 do
    <<prefix::binary-size(5), suffix::binary-size(35)>> =
      :crypto.hash(:sha, password) |> Base.encode16()

    case Req.request(
           method: :get,
           url: "https://api.pwnedpasswords.com/range/" <> prefix,
           decode_body: false,
           retry: false,
           finch: Flirtual.Finch
         ) do
      {:ok, %Req.Response{status: 200, body: body}} ->
        find_count(body, suffix)

      _ ->
        false
    end
  end

  def leaked?(_), do: false

  defp find_count(body, suffix) do
    body
    |> String.split(["\r\n", "\n"], trim: true)
    |> Enum.find_value(false, fn line ->
      case String.split(line, ":", parts: 2) do
        [^suffix, count] -> String.to_integer(String.trim(count))
        _ -> nil
      end
    end)
  end
end

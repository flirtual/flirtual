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
        listed?(body, suffix)

      _ ->
        false
    end
  end

  def leaked?(_), do: false

  defp listed?(body, suffix) do
    body
    |> String.split(["\r\n", "\n"], trim: true)
    |> Enum.any?(fn line ->
      match?([^suffix, _], String.split(line, ":", parts: 2))
    end)
  end
end

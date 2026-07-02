defmodule Flirtual.Chargebee.ReqClient do
  @behaviour Chargebeex.ClientBehaviour

  @impl true
  def get(url, body, headers \\ []), do: request(:get, url, body, headers)

  @impl true
  def post(url, body, headers \\ []), do: request(:post, url, body, headers)

  defp request(method, url, body, headers) do
    [
      method: method,
      url: url,
      body: body,
      headers: headers,
      decode_body: false,
      retry: false,
      finch: Flirtual.Finch
    ]
    |> Req.request()
    |> case do
      {:ok, %Req.Response{status: status, body: response_body} = response} ->
        {:ok, status, Req.get_headers_list(response), response_body}

      {:error, reason} ->
        {:error, 0, [], reason}
    end
  end
end

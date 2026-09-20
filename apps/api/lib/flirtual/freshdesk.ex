defmodule Flirtual.Freshdesk do
  use Flirtual.Logger, :freshdesk

  @open 2
  @low 1

  def config(key), do: Application.get_env(:flirtual, __MODULE__, [])[key]

  def configured?,
    do: config(:domain) not in [nil, ""] and config(:api_key) not in [nil, ""]

  def ticket(attrs) do
    %{
      subject: attrs.subject,
      description: html_body(attrs.body),
      name: attrs.name,
      email: attrs.email,
      status: @open,
      priority: @low,
      custom_fields: attrs.custom_fields
    }
    |> maybe_put(:group_id, attrs[:group_id])
  end

  defp maybe_put(ticket, _key, nil), do: ticket
  defp maybe_put(ticket, key, value), do: Map.put(ticket, key, value)

  def create_ticket(ticket) when is_map(ticket) do
    if configured?() do
      post("/tickets", ticket)
    else
      log(
        :warning,
        ["create_ticket"],
        "Skipping ticket creation due to missing or misconfigured credentials. If this is unintentional, make sure you have set the `FRESHDESK_DOMAIN` and `FRESHDESK_API_KEY` environment variables."
      )

      :ok
    end
  end

  defp post(pathname, body) do
    case Req.request(
           method: :post,
           url: "https://" <> config(:domain) <> "/api/v2" <> pathname,
           json: body,
           headers: [
             {"authorization", "Basic " <> Base.encode64(config(:api_key) <> ":X")},
             {"content-type", "application/json"}
           ],
           receive_timeout: 15_000,
           retry: false,
           finch: Flirtual.Finch
         ) do
      {:ok, %Req.Response{status: status, body: body}} when status in 200..299 ->
        {:ok, body}

      reason ->
        log(:error, ["post", pathname], reason)
        {:error, :freshdesk_unavailable}
    end
  end

  defp html_body(text) when is_binary(text),
    do:
      text
      |> Plug.HTML.html_escape()
      |> String.replace("\n", "<br>")

  defp html_body(_), do: ""
end

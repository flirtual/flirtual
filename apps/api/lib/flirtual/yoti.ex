defmodule Flirtual.Yoti do
  use Flirtual.Logger, :yoti

  alias Flirtual.Yoti.Token

  @auth_url "https://auth.api.yoti.com/v1/oauth/token"
  @scope "avs:sessions:create"

  def config(key), do: Application.get_env(:flirtual, __MODULE__, [])[key]

  def sdk_id, do: config(:sdk_id)

  def sandbox?, do: config(:sandbox?) === true

  def configured?,
    do: sdk_id() not in [nil, ""] and (config(:api_key) not in [nil, ""] or Token.configured?())

  defp api_url(pathname),
    do:
      if(sandbox?(),
        do: "https://age.yoti.com/sandbox/api/v1" <> pathname,
        else: "https://age.yoti.com/api/v1" <> pathname
      )

  def user_view_url(session_id, locale \\ nil) do
    if(sandbox?(), do: "https://age.yoti.com/sandbox", else: "https://age.yoti.com")
    |> URI.parse()
    |> Map.put(
      :query,
      %{"sessionId" => session_id, "sdkId" => sdk_id()}
      |> then(&if(locale, do: Map.put(&1, "locale", locale), else: &1))
      |> URI.encode_query()
    )
    |> URI.to_string()
  end

  def create_session(body) when is_map(body) do
    with {:ok, headers} <- headers(),
         {:ok, %Req.Response{status: 200, body: %{"id" => id} = response}} <-
           Req.request(
             method: :post,
             url: api_url("/sessions"),
             json: body,
             headers: headers,
             receive_timeout: 15_000,
             retry: false,
             finch: Flirtual.Finch
           ) do
      {:ok,
       %{
         id: id,
         status: response["status"],
         expires_at: response["expires_at"]
       }}
    else
      reason ->
        log(:error, ["create_session"], reason)
        {:error, :yoti_unavailable}
    end
  end

  def get_session_result(session_id) when is_binary(session_id) do
    with {:ok, headers} <- headers(),
         {:ok, %Req.Response{status: 200, body: body}} when is_map(body) <-
           Req.request(
             method: :get,
             url: api_url("/sessions/#{session_id}/result"),
             headers: headers,
             receive_timeout: 15_000,
             retry: false,
             finch: Flirtual.Finch
           ) do
      {:ok, body}
    else
      reason ->
        log(:error, ["get_session_result", session_id], reason)
        {:error, :yoti_unavailable}
    end
  end

  def get_session_report(session_id) when is_binary(session_id) do
    with {:ok, headers} <- headers(),
         {:ok, %Req.Response{status: 200, body: %{"results" => results}}} <-
           Req.request(
             method: :get,
             url: api_url("/report/search"),
             params: [checkId: session_id],
             headers: headers,
             receive_timeout: 15_000,
             retry: false,
             finch: Flirtual.Finch
           ) do
      {:ok, List.first(results)}
    else
      reason ->
        log(:error, ["get_session_report", session_id], reason)
        {:error, :yoti_unavailable}
    end
  end

  defp headers do
    with {:ok, authorization} <- authorization() do
      {:ok,
       [
         {"authorization", "Bearer " <> authorization},
         {"content-type", "application/json"},
         {"yoti-sdk-id", sdk_id()}
       ]}
    end
  end

  defp authorization do
    case config(:api_key) do
      api_key when api_key not in [nil, ""] -> {:ok, api_key}
      _ -> Token.get()
    end
  end

  def request_access_token(sdk_id, private_key) do
    with {:ok, assertion} <- client_assertion(sdk_id, private_key),
         {:ok, %Req.Response{status: 200, body: %{"access_token" => access_token} = body}} <-
           Req.request(
             method: :post,
             url: @auth_url,
             form: [
               grant_type: "client_credentials",
               scope: @scope,
               client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
               client_assertion: assertion
             ],
             receive_timeout: 15_000,
             retry: false,
             finch: Flirtual.Finch
           ) do
      {:ok, access_token, body["expires_in"] || 1800}
    else
      reason ->
        log(:error, ["request_access_token"], reason)
        {:error, :yoti_unauthorized}
    end
  end

  defp client_assertion(sdk_id, private_key) do
    now = System.system_time(:second)
    subject = "sdk:" <> sdk_id

    claims = %{
      "iss" => subject,
      "sub" => subject,
      "aud" => @auth_url,
      "jti" => Ecto.UUID.generate(),
      "iat" => now,
      "exp" => now + 1800
    }

    with {:ok, token, _} <-
           Joken.generate_and_sign(
             %{},
             claims,
             Joken.Signer.create("PS384", %{"pem" => private_key})
           ) do
      {:ok, token}
    end
  end

  def verify_notification(payload, signature)
      when is_binary(payload) and is_binary(signature) do
    with public_key when is_binary(public_key) <- config(:notification_public_key),
         {:ok, signature} <- Base.decode64(signature),
         [entry] <- :public_key.pem_decode(public_key) do
      salt_length = byte_size(signature) - 32 - 2

      :public_key.verify(
        payload,
        :sha256,
        signature,
        :public_key.pem_entry_decode(entry),
        rsa_padding: :rsa_pkcs1_pss_padding,
        rsa_pss_saltlen: salt_length,
        rsa_mgf1_md: :sha256
      )
    else
      reason ->
        log(:error, ["verify_notification"], reason)
        false
    end
  end

  def verify_notification(_, _), do: false
end

defmodule Flirtual.Apple do
  use Flirtual.Logger, :apple
  use Flirtual.Connection.Provider, :apple

  alias Flirtual.Jwks

  @apple_auth_url "https://appleid.apple.com"
  @apple_keys_url "https://appleid.apple.com/auth/keys"
  @apple_token_url "https://appleid.apple.com/auth/token"
  @apple_revoke_url "https://appleid.apple.com/auth/revoke"

  def config(key) do
    Application.get_env(:flirtual, Flirtual.Apple)[key]
  end

  def authorize_url(_conn, %{} = options) do
    client_id = config(:service_id)

    state =
      case options do
        %{state: state} -> state
        _ -> Base.url_encode64(:crypto.strong_rand_bytes(32), padding: false)
      end

    redirect_uri = redirect_url!(redirect: Map.get(options, :redirect, true))

    query =
      URI.encode_query(%{
        client_id: client_id,
        redirect_uri: redirect_uri,
        response_type: "code",
        scope: "email",
        response_mode: "form_post",
        state: state
      })

    {:ok, URI.parse("#{@apple_auth_url}/auth/authorize?#{query}")}
  end

  def exchange_code(code, options \\ [])

  def exchange_code(code, options) when is_binary(code) do
    client_id = config(:service_id)

    redirect_uri =
      if Keyword.get(options, :platform) == :android,
        do: android_redirect_url(),
        else: redirect_url!(redirect: Keyword.get(options, :redirect, true))

    with {:ok, client_secret} <- generate_client_secret(client_id),
         {:ok, %Req.Response{body: body, status: 200}} <-
           Req.request(
             method: :post,
             url: @apple_token_url,
             body:
               URI.encode_query(%{
                 client_id: client_id,
                 client_secret: client_secret,
                 code: code,
                 grant_type: "authorization_code",
                 redirect_uri: redirect_uri
               }),
             headers: [{"content-type", "application/x-www-form-urlencoded"}],
             decode_body: false,
             retry: false,
             finch: Flirtual.Finch
           ),
         {:ok, %{"id_token" => id_token} = response} <- Jason.decode(body) do
      {:ok,
       %{
         id_token: id_token,
         access_token: response["access_token"],
         refresh_token: response["refresh_token"]
       }}
    else
      {:ok, %Req.Response{body: body}} ->
        log(:error, [:exchange_code], body)

        case Jason.decode(body) do
          {:ok, %{"error" => "invalid_grant"}} -> {:error, :invalid_grant}
          _ -> {:error, :upstream}
        end

      {:error, reason} ->
        log(:error, [:exchange_code], reason)
        {:error, :upstream}

      reason ->
        log(:error, [:exchange_code], reason)
        {:error, :upstream}
    end
  end

  def tokens(%{access_token: access_token, refresh_token: refresh_token}),
    do: %{access_token: access_token, refresh_token: refresh_token}

  # Native Sign in with Apple returns a one-time authorization_code alongside the
  # id_token; exchanging it yields the long-lived refresh token we need for
  # revocation. Native codes are issued to the app id.
  def exchange_native_code(authorization_code) when is_binary(authorization_code) do
    client_id = config(:app_id)

    with {:ok, client_secret} <- generate_client_secret(client_id),
         {:ok, %Req.Response{body: body, status: 200}} <-
           Req.request(
             method: :post,
             url: @apple_token_url,
             body:
               URI.encode_query(%{
                 client_id: client_id,
                 client_secret: client_secret,
                 code: authorization_code,
                 grant_type: "authorization_code"
               }),
             headers: [{"content-type", "application/x-www-form-urlencoded"}],
             decode_body: false,
             retry: false,
             finch: Flirtual.Finch
           ),
         {:ok, response} <- Jason.decode(body) do
      {:ok, %{access_token: response["access_token"], refresh_token: response["refresh_token"]}}
    else
      reason ->
        log(:error, [:exchange_native_code], reason)
        {:error, :upstream}
    end
  end

  def exchange_native_code(_), do: {:error, :missing_token}

  # Apple returns 200 even for already-invalid tokens. The client id must match
  # the one the token was issued to, so fall back from web (service id) to native
  # (app id) on invalid_client.
  def revoke(%{refresh_token: refresh_token, access_token: access_token}) do
    {token, hint} =
      if is_binary(refresh_token),
        do: {refresh_token, "refresh_token"},
        else: {access_token, "access_token"}

    revoke_token(token, hint, [config(:service_id), config(:app_id)])
  end

  defp revoke_token(token, _hint, _client_ids) when not is_binary(token), do: :ok
  defp revoke_token(_token, _hint, []), do: {:error, :upstream}

  defp revoke_token(token, hint, [client_id | rest]) do
    with {:ok, client_secret} <- generate_client_secret(client_id),
         {:ok, %Req.Response{} = response} <-
           Req.request(
             method: :post,
             url: @apple_revoke_url,
             body:
               URI.encode_query(%{
                 client_id: client_id,
                 client_secret: client_secret,
                 token: token,
                 token_type_hint: hint
               }),
             headers: [{"content-type", "application/x-www-form-urlencoded"}],
             decode_body: false,
             retry: false,
             finch: Flirtual.Finch
           ) do
      cond do
        response.status in 200..299 ->
          :ok

        response.status == 400 and invalid_client?(response.body) and rest != [] ->
          revoke_token(token, hint, rest)

        true ->
          log(:error, [:revoke], response)
          {:error, :upstream}
      end
    else
      reason ->
        log(:error, [:revoke], reason)
        {:error, :upstream}
    end
  end

  defp invalid_client?(body) do
    match?({:ok, %{"error" => "invalid_client"}}, Jason.decode(body))
  end

  def android_redirect_url do
    Application.get_env(:flirtual, :origin)
    |> URI.merge("/v1/connections/grant?type=apple_android")
    |> URI.to_string()
  end

  def get_profile(%{id_token: id_token}), do: get_profile(id_token)

  def get_profile(id_token) when is_binary(id_token) do
    with {:ok, claims} <- verify_id_token(id_token) do
      {:ok,
       %{
         uid: claims["sub"],
         email: claims["email"],
         # Apple doesn't provide a display name, use email
         display_name: claims["email"],
         avatar: nil
       }}
    end
  end

  def verify_id_token(id_token, opts \\ [])

  def verify_id_token(id_token, opts) do
    expected_client_id = Keyword.get(opts, :client_id)

    with {:ok, claims} <- Jwks.verify_token(id_token, @apple_keys_url, ["RS256"]),
         :ok <- validate_claims(claims, expected_client_id) do
      {:ok, claims}
    end
  end

  def verify_native_token(id_token, authorization_code \\ nil)

  def verify_native_token(id_token, _authorization_code) do
    app_id = config(:app_id)
    service_id = config(:service_id)

    case verify_id_token(id_token, client_id: app_id) do
      {:ok, claims} ->
        {:ok, claims}

      {:error, :invalid_audience} ->
        verify_id_token(id_token, client_id: service_id)

      error ->
        error
    end
  end

  defp generate_client_secret(client_id) do
    key = config(:key)
    key_id = config(:key_id)
    team_id = config(:team_id)

    now = System.system_time(:second)
    expiry = now + 86400 * 180

    header = %{
      "alg" => "ES256",
      "kid" => key_id,
      "typ" => "JWT"
    }

    claims = %{
      "iss" => team_id,
      "iat" => now,
      "exp" => expiry,
      "aud" => @apple_auth_url,
      "sub" => client_id
    }

    with {:ok, jwk} <- parse_private_key(key),
         signer <- Joken.Signer.create("ES256", jwk, header),
         {:ok, token, _claims} <- Joken.encode_and_sign(claims, signer) do
      {:ok, token}
    end
  end

  defp parse_private_key(nil) do
    log(:error, [:parse_private_key], "APPLE_KEY not configured")
    {:error, :invalid_private_key}
  end

  defp parse_private_key(pem_key) do
    try do
      [entry] = :public_key.pem_decode(pem_key)
      key = :public_key.pem_entry_decode(entry)

      case JOSE.JWK.from_key(key) do
        %JOSE.JWK{} = jwk ->
          # Joken.Signer.create expects a map, not a JOSE.JWK struct
          {_, jwk_map} = JOSE.JWK.to_map(jwk)
          {:ok, jwk_map}

        {:error, reason} ->
          log(:error, [:parse_private_key], reason)
          {:error, :invalid_private_key}
      end
    rescue
      e ->
        log(:error, [:parse_private_key], e)
        {:error, :invalid_private_key}
    end
  end

  defp validate_claims(claims, expected_client_id) do
    now = System.system_time(:second)

    cond do
      claims["iss"] != @apple_auth_url ->
        {:error, :invalid_issuer}

      claims["exp"] < now ->
        {:error, :token_expired}

      expected_client_id != nil and claims["aud"] != expected_client_id ->
        {:error, :invalid_audience}

      claims["email"] != nil and claims["email_verified"] == false ->
        {:error, :unverified_email}

      true ->
        :ok
    end
  end

  def profile_avatar_url(_), do: nil
  def profile_url(_), do: nil
end

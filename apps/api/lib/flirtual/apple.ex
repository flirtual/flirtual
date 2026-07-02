defmodule Flirtual.Apple do
  use Flirtual.Logger, :apple
  use Flirtual.Connection.Provider, :apple

  @apple_auth_url "https://appleid.apple.com"
  @apple_keys_url "https://appleid.apple.com/auth/keys"
  @apple_token_url "https://appleid.apple.com/auth/token"
  @keys_cache_ttl :timer.hours(1)

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
    redirect_uri = redirect_url!(redirect: Keyword.get(options, :redirect, true))

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
      {:ok, %{id_token: id_token, access_token: response["access_token"]}}
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

    with {:ok, header} <- peek_header(id_token),
         {:ok, keys} <- fetch_apple_public_keys(),
         {:ok, key} <- find_matching_key(keys, header["kid"]),
         {:ok, jwk} <- build_jwk(key),
         {:ok, claims} <- verify_and_decode(id_token, jwk),
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

  defp peek_header(token) do
    case String.split(token, ".") do
      [header_b64 | _] ->
        with {:ok, header_json} <- Base.url_decode64(header_b64, padding: false),
             {:ok, header} <- Jason.decode(header_json) do
          {:ok, header}
        else
          _ -> {:error, :invalid_token_format}
        end

      _ ->
        {:error, :invalid_token_format}
    end
  end

  defp fetch_apple_public_keys do
    cache_key = :apple_public_keys
    now = System.system_time(:millisecond)

    case :persistent_term.get(cache_key, nil) do
      {keys, expiry} when expiry > now ->
        {:ok, keys}

      _ ->
        fetch_and_cache_keys(cache_key)
    end
  end

  defp fetch_and_cache_keys(cache_key) do
    with {:ok, %Req.Response{body: body, status: 200}} <-
           Req.request(
             method: :get,
             url: @apple_keys_url,
             decode_body: false,
             retry: false,
             finch: Flirtual.Finch
           ),
         {:ok, %{"keys" => keys}} <- Jason.decode(body) do
      expiry = System.system_time(:millisecond) + @keys_cache_ttl
      :persistent_term.put(cache_key, {keys, expiry})
      {:ok, keys}
    else
      {:ok, %Req.Response{} = response} ->
        log(:error, [:fetch_apple_public_keys], response)
        {:error, :upstream}

      {:error, reason} ->
        log(:error, [:fetch_apple_public_keys], reason)
        {:error, :upstream}
    end
  end

  defp find_matching_key(keys, kid) do
    case Enum.find(keys, &(&1["kid"] == kid)) do
      nil -> {:error, :key_not_found}
      key -> {:ok, key}
    end
  end

  defp build_jwk(key) do
    try do
      jwk = JOSE.JWK.from_map(key)
      {:ok, jwk}
    rescue
      e ->
        log(:error, [:build_jwk], e)
        {:error, :invalid_key}
    end
  end

  defp verify_and_decode(token, jwk) do
    try do
      case JOSE.JWT.verify_strict(jwk, ["RS256"], token) do
        {true, %JOSE.JWT{fields: claims}, _} -> {:ok, claims}
        {false, _, _} -> {:error, :invalid_signature}
      end
    rescue
      e ->
        log(:error, [:verify_and_decode], e)
        {:error, :verification_failed}
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

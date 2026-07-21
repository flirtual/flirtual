defmodule Flirtual.Jwks do
  use Flirtual.Logger, :jwks

  @cache_ttl :timer.hours(1)

  def verify_token(token, keys_url, algorithms) do
    with {:ok, header} <- peek_header(token),
         {:ok, keys} <- fetch_keys(keys_url),
         {:ok, key} <- find_matching_key(keys, header["kid"]),
         {:ok, jwk} <- build_jwk(key) do
      verify_and_decode(token, jwk, algorithms)
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

  defp fetch_keys(keys_url) do
    cache_key = {:jwks, keys_url}
    now = System.system_time(:millisecond)

    case :persistent_term.get(cache_key, nil) do
      {keys, expiry} when expiry > now ->
        {:ok, keys}

      _ ->
        fetch_and_cache_keys(cache_key, keys_url)
    end
  end

  defp fetch_and_cache_keys(cache_key, keys_url) do
    with {:ok, %Req.Response{body: body, status: 200}} <-
           Req.request(
             method: :get,
             url: keys_url,
             decode_body: false,
             retry: false,
             finch: Flirtual.Finch
           ),
         {:ok, %{"keys" => keys}} <- Jason.decode(body) do
      expiry = System.system_time(:millisecond) + @cache_ttl
      :persistent_term.put(cache_key, {keys, expiry})
      {:ok, keys}
    else
      {:ok, %Req.Response{} = response} ->
        log(:error, [:fetch_keys, keys_url], response)
        {:error, :upstream}

      {:error, reason} ->
        log(:error, [:fetch_keys, keys_url], reason)
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

  defp verify_and_decode(token, jwk, algorithms) do
    try do
      case JOSE.JWT.verify_strict(jwk, algorithms, token) do
        {true, %JOSE.JWT{fields: claims}, _} -> {:ok, claims}
        {false, _, _} -> {:error, :invalid_signature}
      end
    rescue
      e ->
        log(:error, [:verify_and_decode], e)
        {:error, :verification_failed}
    end
  end
end

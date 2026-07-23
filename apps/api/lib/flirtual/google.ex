defmodule Flirtual.Google do
  use Flirtual.Logger, :google
  use Flirtual.Connection.Provider, :google

  alias Flirtual.Jwks

  @google_authorize_url "https://accounts.google.com/o/oauth2/v2/auth"
  @google_token_url "https://oauth2.googleapis.com/token"
  @google_revoke_url "https://oauth2.googleapis.com/revoke"
  @google_keys_url "https://www.googleapis.com/oauth2/v3/certs"
  @google_issuers ["https://accounts.google.com", "accounts.google.com"]

  def config(key) do
    Application.get_env(:flirtual, Flirtual.Google)[key]
  end

  def authorize_url(_conn, %{} = options) do
    state =
      case options do
        %{state: state} -> state
        _ -> Base.url_encode64(:crypto.strong_rand_bytes(32), padding: false)
      end

    redirect_uri = redirect_url!(redirect: Map.get(options, :redirect, true))

    query =
      URI.encode_query(%{
        client_id: config(:web_client_id),
        redirect_uri: redirect_uri,
        response_type: "code",
        scope: "openid email",
        prompt: "select_account",
        access_type: "offline",
        state: state
      })

    {:ok, URI.parse("#{@google_authorize_url}?#{query}")}
  end

  def exchange_code(code, options \\ [])

  def exchange_code(code, options) when is_binary(code) do
    redirect_uri = redirect_url!(redirect: Keyword.get(options, :redirect, true))

    with {:ok, %Req.Response{body: body, status: 200}} <-
           Req.request(
             method: :post,
             url: @google_token_url,
             body:
               URI.encode_query(%{
                 client_id: config(:web_client_id),
                 client_secret: config(:web_client_secret),
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

  def revoke(%{refresh_token: refresh_token, access_token: access_token}) do
    do_revoke(refresh_token || access_token)
  end

  defp do_revoke(token) when not is_binary(token), do: :ok

  defp do_revoke(token) do
    case Req.request(
           method: :post,
           url: @google_revoke_url,
           body: URI.encode_query(%{token: token}),
           headers: [{"content-type", "application/x-www-form-urlencoded"}],
           decode_body: false,
           retry: false,
           finch: Flirtual.Finch
         ) do
      {:ok, %Req.Response{status: status}} when status in [200, 400] ->
        # 400 is already invalid/expired.
        :ok

      other ->
        log(:error, [:revoke], other)
        {:error, :upstream}
    end
  end

  def get_profile(%{id_token: id_token}), do: get_profile(id_token)

  def get_profile(id_token) when is_binary(id_token) do
    with {:ok, claims} <- verify_id_token(id_token) do
      {:ok, profile(claims)}
    end
  end

  def profile(claims) do
    %{
      uid: claims["sub"],
      email: claims["email"],
      display_name: claims["email"],
      avatar: nil
    }
  end

  def verify_id_token(id_token, opts \\ []) do
    expected_client_id = Keyword.get(opts, :client_id)

    with {:ok, claims} <- Jwks.verify_token(id_token, @google_keys_url, ["RS256"]),
         :ok <- validate_claims(claims, expected_client_id) do
      {:ok, claims}
    end
  end

  # Android and web tokens carry the web client ID audience; iOS tokens carry
  # the iOS client ID.
  def verify_native_token(id_token) do
    case verify_id_token(id_token, client_id: config(:web_client_id)) do
      {:ok, claims} ->
        {:ok, claims}

      {:error, :invalid_audience} ->
        verify_id_token(id_token, client_id: config(:ios_client_id))

      error ->
        error
    end
  end

  defp validate_claims(claims, expected_client_id) do
    now = System.system_time(:second)

    cond do
      claims["iss"] not in @google_issuers ->
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
end

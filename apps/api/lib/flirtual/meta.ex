defmodule Flirtual.Meta do
  use Flirtual.Logger, :meta
  use Flirtual.Connection.Provider, :meta

  alias Flirtual.Connection

  @sso_url "https://auth.oculus.com/sso/"
  @graph_url "https://graph.oculus.com/"

  def profile_url(%Connection{display_name: username}) when is_binary(username),
    do: "https://horizon.meta.com/profile/#{URI.encode(username, &URI.char_unreserved?/1)}/"

  def config(key) do
    Application.get_env(:flirtual, Flirtual.Meta)[key]
  end

  def callback_url(kind \\ :web) do
    path =
      case kind do
        :app -> "/v1/connections/meta/callback/app"
        _ -> "/v1/connections/meta/callback"
      end

    Application.get_env(:flirtual, :origin)
    |> URI.merge(path)
    |> URI.to_string()
  end

  # Account Linking's authorization carries no state, only the org id and a
  # callback URI (`redirect` picks web or app). State is carried out of band.
  def authorize_url(_conn, options) do
    {:ok,
     URI.parse(
       @sso_url <>
         "?" <>
         URI.encode_query(%{
           redirect_uri: callback_url(Map.get(options, :redirect, :web)),
           organization_id: config(:organization_id)
         })
     )}
  end

  # Not supported by Meta.
  def revoke(%Connection{}), do: :ok

  def exchange_code(code, options \\ [])

  def exchange_code(code, options) when is_binary(code) do
    case Keyword.get(options, :org_scoped_id) do
      org_scoped_id when is_binary(org_scoped_id) -> request_oauth_token(code, org_scoped_id)
      _ -> {:error, :invalid_grant}
    end
  end

  defp request_oauth_token(code, org_scoped_id) do
    with {:ok, %Req.Response{body: body}} <-
           Req.request(
             method: :post,
             url:
               @graph_url <>
                 "sso_authorize_code?" <>
                 URI.encode_query(%{
                   code: code,
                   org_scoped_id: org_scoped_id,
                   access_token: app_access_token()
                 }),
             decode_body: false,
             retry: false,
             finch: Flirtual.Finch
           ),
         {:ok, %{"oauth_token" => oauth_token}} <- Jason.decode(body) do
      {:ok, oauth_token}
    else
      {:ok, %{"error" => _} = body} ->
        log(:error, [:exchange_code], body)
        {:error, :invalid_grant}

      reason ->
        log(:error, [:exchange_code], reason)
        {:error, :upstream}
    end
  end

  # A freshly-issued oauth_token is rejected at /me ("Token not authorized ...")
  # until it propagates, so retry.
  @profile_retry_delays [1_500, 2_000, 2_000, 2_500]

  def get_profile(oauth_token) when is_binary(oauth_token),
    do: get_profile(oauth_token, @profile_retry_delays)

  defp get_profile(oauth_token, delays) do
    case fetch_me(oauth_token) do
      {:error, :token_not_ready} ->
        case delays do
          [delay | rest] ->
            Process.sleep(delay)
            get_profile(oauth_token, rest)

          [] ->
            log(:error, [:get_profile], "token not authorized after retries")
            {:error, :upstream}
        end

      result ->
        result
    end
  end

  defp fetch_me(oauth_token) do
    with {:ok, %Req.Response{body: body}} <-
           Req.request(
             method: :get,
             url:
               @graph_url <>
                 "me?" <>
                 URI.encode_query(%{access_token: oauth_token, fields: "id,alias"}),
             decode_body: false,
             retry: false,
             finch: Flirtual.Finch
           ),
         {:ok, decoded} <- Jason.decode(body) do
      case decoded do
        %{"id" => id} = profile ->
          {:ok, %{uid: id, email: nil, display_name: profile["alias"], avatar: nil}}

        %{"error" => %{"message" => message}}
        when is_binary(message) ->
          if String.contains?(message, "not authorized") do
            {:error, :token_not_ready}
          else
            log(:error, [:get_profile], decoded)
            {:error, :upstream}
          end

        _ ->
          log(:error, [:get_profile], decoded)
          {:error, :upstream}
      end
    else
      reason ->
        log(:error, [:get_profile], reason)
        {:error, :upstream}
    end
  end

  defp app_access_token, do: "OC|#{config(:app_id)}|#{config(:app_secret)}"
end

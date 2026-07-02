defmodule Flirtual.Elasticsearch do
  use Snap.Cluster, otp_app: :flirtual
end

defmodule Flirtual.Elasticsearch.Auth do
  @behaviour Snap.Auth

  @impl true
  def sign(config, method, path, headers, body) do
    headers =
      case Keyword.get(config, :access_token) do
        token when is_binary(token) ->
          [{"authorization", "ApiKey " <> token} | headers]

        _ ->
          headers
      end

    {:ok, {method, path, headers, body}}
  end
end

defmodule Flirtual.Connection.Provider do
  # Prefer the scopes reported by the provider as granted, falling back to the
  # requested scopes (e.g. Apple does not report granted scopes).
  def granted_scope(scope, _requested) when is_binary(scope),
    do: String.split(scope, " ", trim: true)

  def granted_scope(_scope, requested), do: requested

  defmacro __using__(name) when is_atom(name) do
    quote do
      @provider_name unquote(name)
      @before_compile Flirtual.Connection.Provider
    end
  end

  defmacro __using__(_) do
    raise "Provider name must be an atom"
  end

  defmacro __before_compile__(_) do
    quote do
      def profile_avatar_url(_), do: nil
      def profile_url(_), do: nil

      def authorize_url(_, _) do
        {:error, :not_supported}
      end

      def redirect_url(options \\ []) do
        case Keyword.get(options, :redirect, true) do
          :app ->
            {
              :ok,
              Application.fetch_env!(:flirtual, :app_scheme) <>
                "://oauth-callback?" <> URI.encode_query(%{type: @provider_name})
            }

          _ ->
            {
              :ok,
              Application.get_env(:flirtual, :origin)
              |> URI.merge("/v1/connections/grant?" <> URI.encode_query(%{type: @provider_name}))
            }
        end
      end

      def redirect_url!(options \\ []) do
        {:ok, url} = redirect_url(options)
        url
      end

      def exchange_code(_, _) do
        {:error, :not_supported}
      end

      def tokens(_), do: %{access_token: nil, refresh_token: nil}

      def revoke(_), do: :ok
    end
  end
end

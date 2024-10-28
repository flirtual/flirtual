defmodule Flirtual.Connection.Provider do
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
        {:ok,
         Application.get_env(:flirtual, :origin)
         |> URI.merge(
           "/v1/connections/grant?" <>
             URI.encode_query(
               %{
                 type: @provider_name
               }
               |> Map.merge(
                 if(Keyword.get(options, :redirect, true), do: %{}, else: %{redirect: "off"})
               )
             )
         )}
      end

      def redirect_url!(options \\ []) do
        case redirect_url(options) do
          {:ok, url} -> url
          {:error, reason} -> raise reason
        end
      end

      def exchange_code(_, _) do
        {:error, :not_supported}
      end
    end
  end
end

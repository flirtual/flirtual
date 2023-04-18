defmodule Flirtual.Crypto do
  alias FlirtualWeb.Endpoint

  def encrypt(context, term) do
    Plug.Crypto.encrypt(secret(), to_string(context), term)
  end

  def decrypt(context, cipher) when is_binary(cipher) do
    Plug.Crypto.decrypt(secret(), to_string(context), cipher, max_age: :infinity)
  end

  defp secret, do: Endpoint.config(:secret_key_base)
end

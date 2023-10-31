defmodule Flirtual.Apple do
  use Flirtual.Logger, :apple
  use Flirtual.Connection.Provider, :apple

  def config(key) do
    Application.get_env(:flirtual, Flirtual.Apple)[key]
  end

  def authorize_url(_, %{state: state}) do
    URI.new(
      "https://appleid.apple.com/auth/authorize?" <>
        URI.encode_query(%{
          client_id: config(:client_id),
          redirect_uri: redirect_url!(),
          state: state,
          response_type: "code",
          scope: "name email"
        })
    )
  end
end

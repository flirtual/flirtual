defmodule Flirtual.User.LoginTest do
  use ExUnit.Case, async: false

  alias Flirtual.User.Login

  @configured %{
    Flirtual.Google => [web_client_id: "google-id", web_client_secret: "google-secret"],
    Flirtual.Apple => [key: "apple-key", service_id: "apple-service"],
    Flirtual.Discord => [client_id: "discord-id", client_secret: "discord-secret"]
  }

  setup do
    saved =
      for key <- [:features | Map.keys(@configured)], into: %{} do
        {key, Application.get_env(:flirtual, key)}
      end

    on_exit(fn ->
      for {key, value} <- saved do
        if value == nil,
          do: Application.delete_env(:flirtual, key),
          else: Application.put_env(:flirtual, key, value)
      end
    end)

    for {module, settings} <- @configured, do: Application.put_env(:flirtual, module, settings)
    :ok
  end

  defp features(login, connections \\ ~w(discord vrchat google apple meta)) do
    features = Application.get_env(:flirtual, :features, [])

    Application.put_env(
      :flirtual,
      :features,
      Keyword.merge(features, login: login, connections: connections)
    )
  end

  test "lists every listed, configured login method, email first" do
    features(~w(google discord apple email))
    assert Login.providers() == [:email, :apple, :discord, :google]
  end

  test "leaves out email when the login list doesn't name it" do
    features(~w(google))
    assert Login.providers() == [:google]
  end

  test "leaves out a listed OAuth method whose connection is disabled" do
    features(~w(google apple), ~w(google))
    assert Login.providers() == [:google]
  end

  test "leaves out a listed OAuth method without credentials" do
    features(~w(discord google apple))
    Application.put_env(:flirtual, Flirtual.Discord, webhook_admin: "1/abc")
    Application.put_env(:flirtual, Flirtual.Apple, key: "apple-key", service_id: nil)
    assert Login.providers() == [:google]
  end

  test "ignores methods that can't log in" do
    features(~w(meta vrchat unknown))
    assert Login.providers() == []
  end
end

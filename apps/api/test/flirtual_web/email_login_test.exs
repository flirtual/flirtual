defmodule FlirtualWeb.EmailLoginTest do
  use ExUnit.Case, async: false

  import Plug.Test

  alias FlirtualWeb.{SessionController, UsersController}

  setup do
    features = Application.get_env(:flirtual, :features)
    on_exit(fn -> Application.put_env(:flirtual, :features, features) end)
    Application.put_env(:flirtual, :features, Keyword.put(features, :login, ["google"]))
    :ok
  end

  test "password login is refused while email login is off" do
    params = %{"login" => "someone@example.com", "password" => "password"}

    assert SessionController.login(conn(:post, "/v1/session", params), params) ==
             {:error, {:forbidden, :email_login_disabled}}
  end

  test "password sign-up is refused while email login is off" do
    params = %{"email" => "someone@example.com", "password" => "password"}

    assert UsersController.create(conn(:post, "/v1/users", params), params) ==
             {:error, {:forbidden, :email_login_disabled}}
  end
end

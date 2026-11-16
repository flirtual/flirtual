defmodule FlirtualWeb.PhoneLoginTest do
  use ExUnit.Case, async: false

  import Plug.Test

  alias Flirtual.{PhoneVerification, Repo, Users}
  alias FlirtualWeb.PhoneLoginController

  @phone "+447400123456"

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
    Ecto.Adapters.SQL.Sandbox.mode(Repo, {:shared, self()})
    ExRated.delete_bucket("phone_verify:#{@phone}")

    saved = {Application.get_env(:flirtual, :features), Application.get_env(:flirtual, Flirtual.Notify)}

    on_exit(fn ->
      {features, notify} = saved
      Application.put_env(:flirtual, :features, features)
      Application.put_env(:flirtual, Flirtual.Notify, notify || [])
    end)

    {features, _} = saved
    Application.put_env(:flirtual, :features, Keyword.put(features, :login, ["phone"]))

    Application.put_env(:flirtual, Flirtual.Notify,
      configuration_id: "nc-1234",
      access_key: "AKIAEXAMPLE",
      secret: "secret"
    )

    :ok
  end

  defp verify(params) do
    conn =
      conn(:post, "/v1/session/phone/verify", params)
      |> init_test_session(%{})

    PhoneLoginController.verify(conn, params)
  end

  test "a known number logs in" do
    {:ok, user} = Users.create_from_phone(@phone)
    {:ok, code} = PhoneVerification.create(@phone)

    conn = verify(%{"phone_number" => "+44 7400 123456", "code" => code})

    assert conn.status == 200
    assert conn.assigns.session.user_id == user.id
  end

  test "an unknown number is refused when logging in" do
    {:ok, code} = PhoneVerification.create(@phone)

    assert verify(%{"phone_number" => @phone, "code" => code}) ==
             {:error, {:not_found, :phone_not_registered}}

    assert Users.get_by_phone(@phone) == nil
  end

  test "an unknown number signs up" do
    {:ok, code} = PhoneVerification.create(@phone)

    conn = verify(%{"phone_number" => @phone, "code" => code, "signup" => true})

    assert conn.status == 201
    assert %{id: id} = Users.get_by_phone(@phone)
    assert conn.assigns.session.user_id == id
  end

  test "a wrong code is refused" do
    {:ok, _} = Users.create_from_phone(@phone)
    {:ok, code} = PhoneVerification.create(@phone)
    wrong = if code == "482913", do: "482914", else: "482913"

    assert verify(%{"phone_number" => @phone, "code" => wrong}) ==
             {:error, {:unauthorized, :verification_invalid_code}}
  end

  test "phone login is refused while it's not offered" do
    Application.put_env(:flirtual, :features, Keyword.put(Application.get_env(:flirtual, :features), :login, ["email"]))

    assert verify(%{"phone_number" => @phone, "code" => "482913"}) ==
             {:error, {:forbidden, :phone_login_disabled}}
  end
end

defmodule Flirtual.NotifyTest do
  use ExUnit.Case, async: false

  alias Flirtual.Notify

  @config [
    configuration_id: "nc-1234",
    region: "us-east-1",
    access_key: "AKIAEXAMPLE",
    secret: "secret",
    req_options: [plug: {Req.Test, Flirtual.Notify}]
  ]

  setup do
    saved = Application.get_env(:flirtual, Notify)
    on_exit(fn -> Application.put_env(:flirtual, Notify, saved || []) end)
    Application.put_env(:flirtual, Notify, @config)
    :ok
  end

  test "sends the code through the configuration's default template" do
    Req.Test.stub(Notify, fn conn ->
      {:ok, body, conn} = Plug.Conn.read_body(conn)

      assert conn.host == "sms-voice.us-east-1.amazonaws.com"

      assert Plug.Conn.get_req_header(conn, "x-amz-target") == [
               "PinpointSMSVoiceV2.SendNotifyTextMessage"
             ]

      assert [authorization] = Plug.Conn.get_req_header(conn, "authorization")
      assert authorization =~ "/us-east-1/sms-voice/aws4_request"

      assert Jason.decode!(body) == %{
               "NotifyConfigurationId" => "nc-1234",
               "DestinationPhoneNumber" => "+447400123456",
               "TemplateVariables" => %{"code" => "482913"}
             }

      Req.Test.json(conn, %{"MessageId" => "message-1"})
    end)

    assert Notify.send_code("+447400123456", "482913") == {:ok, "message-1"}
  end

  test "reports a refused send as failed" do
    Req.Test.stub(Notify, fn conn ->
      conn
      |> Plug.Conn.put_status(400)
      |> Req.Test.json(%{"__type" => "ValidationException", "Reason" => "INVALID_PARAMETER"})
    end)

    assert Notify.send_code("+447400123456", "482913") == {:error, :sms_failed}
  end

  test "is unconfigured without a configuration id" do
    Application.put_env(:flirtual, Notify, Keyword.delete(@config, :configuration_id))

    refute Notify.configured?()
    assert Notify.send_code("+447400123456", "482913") == {:error, :sms_unavailable}
  end

  test "is configured with an id and credentials" do
    assert Notify.configured?()
  end
end

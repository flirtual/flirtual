defmodule Flirtual.Notify do
  # AWS End User Messaging Notify: https://docs.aws.amazon.com/sms-voice/latest/userguide/notify.html
  require Logger

  def config(key), do: Application.get_env(:flirtual, Flirtual.Notify, [])[key]

  def configured?,
    do:
      config(:log_codes) == true or
        (config(:configuration_id) != nil and config(:access_key) != nil and
           config(:secret) != nil)

  def send_code(phone_number, code) do
    cond do
      config(:log_codes) == true ->
        Logger.warning("SMS code for #{phone_number}: #{code} (logged, not sent)")
        {:ok, nil}

      configured?() ->
        send_text(phone_number, code)

      true ->
        {:error, :sms_unavailable}
    end
  end

  defp send_text(phone_number, code) do
    region = config(:region)

    [
      url: "https://sms-voice.#{region}.amazonaws.com/",
      headers: [
        {"x-amz-target", "PinpointSMSVoiceV2.SendNotifyTextMessage"},
        {"content-type", "application/x-amz-json-1.0"}
      ],
      body:
        Jason.encode!(%{
          "NotifyConfigurationId" => config(:configuration_id),
          "DestinationPhoneNumber" => phone_number,
          "TemplateVariables" => %{"code" => code}
        }),
      aws_sigv4: [
        service: "sms-voice",
        region: region,
        access_key_id: config(:access_key),
        secret_access_key: config(:secret)
      ],
      retry: false
    ]
    |> Keyword.merge(config(:req_options) || [])
    |> Req.post()
    |> case do
      {:ok, %Req.Response{status: 200, body: body}} ->
        {:ok, decode(body)["MessageId"]}

      {:ok, %Req.Response{status: status, body: body}} ->
        Logger.warning("Notify refused a code (#{status}): #{inspect(decode(body))}")
        {:error, :sms_failed}

      {:error, reason} ->
        Logger.warning("Notify request failed: #{inspect(reason)}")
        {:error, :sms_failed}
    end
  end

  defp decode(body) when is_binary(body), do: Jason.decode!(body)
  defp decode(body), do: body
end

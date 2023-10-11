defmodule Flirtual.PushNotification do
  use Flirtual.Logger, :pushnotification

  alias Flirtual.APNS
  alias Flirtual.FCM
  alias Pigeon.APNS.Notification, as: APNSNotification
  alias Pigeon.FCM.Notification, as: FCMNotification

  defp handle_response(%_{response: :success}), do: :ok

  defp handle_response(%APNSNotification{response: error}),
    do: log(:error, [:apns], error)

  defp handle_response(%FCMNotification{response: error}),
    do: log(:error, [:fcm], error)

  def send(user, title, message, url) do
    if is_binary(user.apns_token),
      do:
        APNS.push(
          APNSNotification.new(
            %{
              "title" => title,
              "body" => message
            },
            user.apns_token,
            Application.fetch_env!(:flirtual, Flirtual.APNS)[:topic]
          ),
          on_response: &handle_response/1
        )

    if is_binary(user.fcm_token),
      do:
        FCM.push(
          FCMNotification.new(
            {:token, user.fcm_token},
            %{
              "title" => title,
              "body" => message
            },
            %{
              "url" => url
            }
          ),
          on_response: &handle_response/1
        )

    :ok
  end
end

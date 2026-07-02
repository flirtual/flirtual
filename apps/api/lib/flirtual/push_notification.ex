defmodule Flirtual.PushNotification do
  use Flirtual.Logger, :pushnotification

  require OpenTelemetry.Tracer, as: Tracer

  alias Flirtual.{APNS, FCM, User}
  alias Pigeon.APNS.Notification, as: APNSNotification
  alias Pigeon.FCM.Notification, as: FCMNotification

  defp handle_response(%_{response: :success}, _, _), do: :ok

  defp handle_response(%APNSNotification{response: error}, user, token)
       when error in [:unregistered, :expired_token] do
    User.remove_push_token(user, :apns, token)
  end

  defp handle_response(%APNSNotification{response: error}, _, _),
    do: log(:error, [:apns], error)

  defp handle_response(%FCMNotification{response: :unregistered}, user, token) do
    User.remove_push_token(user, :fcm, token)
  end

  defp handle_response(%FCMNotification{response: error}, _, _),
    do: log(:error, [:fcm], error)

  defp finish_span(span, response) do
    OpenTelemetry.Span.set_attribute(span, :"messaging.response", to_string(response))

    unless response == :success do
      OpenTelemetry.Span.set_status(span, OpenTelemetry.status(:error, to_string(response)))
    end

    OpenTelemetry.Span.end_span(span)
  end

  def send(user, title, message, url) do
    {:ok, user} = User.increment_push_count(user)

    Enum.each(user.apns_tokens, fn token ->
      span =
        Tracer.start_span("push apns", %{kind: :client, attributes: %{"messaging.system": "apns"}})

      APNS.push(
        %APNSNotification{
          device_token: token,
          payload: %{
            "aps" => %{
              "alert" => %{
                "title" => title,
                "body" => message
              },
              "badge" => user.push_count,
              "sound" => "default"
            },
            "url" => url
          },
          topic: Application.fetch_env!(:flirtual, Flirtual.APNS)[:topic]
        },
        on_response: fn notification ->
          finish_span(span, notification.response)
          handle_response(notification, user, token)
        end
      )
    end)

    Enum.each(user.fcm_tokens, fn token ->
      span =
        Tracer.start_span("push fcm", %{kind: :client, attributes: %{"messaging.system": "fcm"}})

      FCM.push(
        FCMNotification.new(
          {:token, token},
          %{
            "title" => title,
            "body" => message
          },
          %{
            "url" => url
          }
        ),
        on_response: fn notification ->
          finish_span(span, notification.response)
          handle_response(notification, user, token)
        end
      )
    end)

    :ok
  end
end

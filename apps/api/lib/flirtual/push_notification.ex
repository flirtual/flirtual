defmodule Flirtual.PushNotification do
  use Flirtual.Logger, :pushnotification

  require OpenTelemetry.Tracer, as: Tracer

  use Gettext, backend: Flirtual.Gettext

  alias Flirtual.{APNS, Chat, FCM, User}
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

  defp apns_push(user, token, payload) do
    span =
      Tracer.start_span("push apns", %{kind: :client, attributes: %{"messaging.system": "apns"}})

    APNS.push(
      %APNSNotification{
        device_token: token,
        payload: payload,
        topic: Application.fetch_env!(:flirtual, Flirtual.APNS)[:topic]
      },
      on_response: fn notification ->
        finish_span(span, notification.response)
        handle_response(notification, user, token)
      end
    )
  end

  defp fcm_push(user, token, notification) do
    span =
      Tracer.start_span("push fcm", %{kind: :client, attributes: %{"messaging.system": "fcm"}})

    FCM.push(notification,
      on_response: fn notification ->
        finish_span(span, notification.response)
        handle_response(notification, user, token)
      end
    )
  end

  @klipy_media ~r/^https:\/\/static\d*\.klipy\.com\/\S+$/
  @max_body_bytes 1000

  def send_message(
        %User{} = user,
        %User{} = sender,
        %Chat.Message{} = message,
        gif_preview \\ nil
      ) do
    {:ok, user} = User.increment_push_count(user)

    language = user.preferences.language || "en"
    text = Chat.text(message)
    gif? = String.match?(text, @klipy_media)
    gif = if gif?, do: gif_preview || text

    body =
      if gif?,
        do: Gettext.with_locale(language, fn -> dgettext("notifications", "gif") end),
        else: Flirtual.Utilities.truncate_bytes(text, @max_body_bytes)

    name = User.display_name(sender)
    avatar = User.avatar_url(sender, "icon")
    url = "flirtual://matches/" <> message.conversation_id

    Enum.each(user.apns_tokens, fn token ->
      apns_push(
        user,
        token,
        %{
          "aps" => %{
            "alert" => %{"title" => name, "body" => body},
            "badge" => user.push_count,
            "sound" => "default",
            "mutable-content" => 1,
            "thread-id" => message.conversation_id,
            "category" => "message"
          },
          "url" => url,
          "conversation_id" => message.conversation_id,
          "message_id" => message.id,
          "sender" => %{"id" => sender.id, "name" => name, "avatar" => avatar},
          "gif" => gif
        }
        |> Map.reject(fn {_, value} -> is_nil(value) end)
      )
    end)

    Enum.each(user.fcm_tokens, fn token ->
      fcm_push(
        user,
        token,
        %FCMNotification{
          target: {:token, token},
          notification: nil,
          android: %{"priority" => "high"},
          data:
            %{
              "type" => "message",
              "url" => url,
              "conversation_id" => message.conversation_id,
              "message_id" => message.id,
              "sender_id" => sender.id,
              "sender_name" => name,
              "sender_avatar" => avatar,
              "text" => body,
              "sent_at" => message.created_at |> DateTime.to_unix(:millisecond) |> to_string(),
              "gif" => gif
            }
            |> Map.reject(fn {_, value} -> is_nil(value) end)
        }
      )
    end)

    :ok
  end

  def send(user, title, message, url) do
    {:ok, user} = User.increment_push_count(user)

    Enum.each(user.apns_tokens, fn token ->
      apns_push(user, token, %{
        "aps" => %{
          "alert" => %{"title" => title, "body" => message},
          "badge" => user.push_count,
          "sound" => "default"
        },
        "url" => url
      })
    end)

    Enum.each(user.fcm_tokens, fn token ->
      fcm_push(
        user,
        token,
        FCMNotification.new({:token, token}, %{"title" => title, "body" => message}, %{
          "url" => url
        })
      )
    end)

    :ok
  end
end

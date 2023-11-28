defmodule Flirtual.User.Email do
  alias Flirtual.User

  def deliver(%User{} = user, :suspended, message) do
    %{
      "user_id" => user.id,
      "from" => "moderation@flirtu.al",
      "subject" => "Your account has been disabled",
      "body_text" => """
      Our moderation team has found your Flirtual account in violation of our rules.

      Reason: #{message}

      Your account data will be kept for 30 days. Please reply to this message within 30 days if you would like to appeal this moderation decision or if you would like us to delete your account immediately. If you have not received a response to your appeal within 30 days, it has been reviewed and denied.

      The Flirtual Team
      """,
      "body_html" => """
      <p>Our moderation team has found your Flirtual account in violation of our rules.</p>

      <p>Reason: #{message}</p>

      <p>Your account data will be kept for 30 days. Please reply to this message within 30 days if you would like to appeal this moderation decision or if you would like us to delete your account immediately. If you have not received a response to your appeal within 30 days, it has been reviewed and denied.</p>

      <p>The Flirtual Team</p>
      """
    }
    |> Flirtual.ObanWorkers.Email.new()
    |> Oban.insert()
  end

  def deliver(%User{} = user, :confirm_email, token) do
    action_url =
      Application.fetch_env!(:flirtual, :frontend_origin)
      |> URI.merge("/confirm-email?token=" <> token)
      |> URI.to_string()

    %{
      "user_id" => user.id,
      "subject" => "Confirm your email address",
      "action_url" => action_url,
      "body_text" => """
      Please confirm your email address:
      #{action_url}
      """,
      "body_html" => """
      <p>Please click here to confirm your email:</p>

      <p><a href="#{action_url}" class="btn">Confirm</a></p>

      <script type="application/ld+json">
      {
        "@context": "http://schema.org",
        "@type": "EmailMessage",
        "description": "Confirm your email",
        "potentialAction": {
          "@type": "ViewAction",
          "url": "$confirm",
          "name": "Confirm"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Flirtual",
          "url": "https://flirtu.al/"
        }
      }
      </script>
      """
    }
    |> Flirtual.ObanWorkers.Email.new()
    |> Oban.insert()
  end

  def deliver(%User{} = user, :reset_password, token) do
    action_url =
      Application.fetch_env!(:flirtual, :frontend_origin)
      |> URI.merge("/forgot/" <> token)
      |> URI.to_string()

    %{
      "user_id" => user.id,
      "subject" => "Password reset request",
      "action_url" => action_url,
      "body_text" => """
      Please confirm your email address:
      #{action_url}

      If you did not request this email, please ignore it.
      """,
      "body_html" => """
      <p>Please click here to reset your Flirtual password:</p>

      <p><a href="#{action_url}" class="btn">Reset your password</a></p>

      <p>If you did not request this email, please ignore it.</p>

      <script type="application/ld+json">
      {
        "@context": "http://schema.org",
        "@type": "EmailMessage",
        "description": "Reset your password",
        "potentialAction": {
          "@type": "ViewAction",
          "url": "$reset",
          "name": "Reset"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Flirtual",
          "url": "https://flirtu.al/"
        }
      }
      </script>
      """
    }
    |> Flirtual.ObanWorkers.Email.new()
    |> Oban.insert()
  end
end

defmodule Flirtual.User.Email do
  alias Flirtual.Mailer
  alias Flirtual.User

  def deliver(%User{} = user, :suspended, message) do
    Mailer.send(
      user,
      "Your account has been disabled",
      """
      Our moderation team has found your Flirtual account in violation of our rules.

      Reason: #{message}

      Your account data will be kept for 30 days. Please reply to this message within 30 days if you would like to appeal this moderation decision or if you would like us to delete your account immediately.

      The Flirtual Team
      """,
      """
      <p>Our moderation team has found your Flirtual account in violation of our rules.</p>

      <p>Reason: #{message}</p>

      <p>Your account data will be kept for 30 days. Please reply to this message within 30 days if you would like to appeal this moderation decision or if you would like us to delete your account immediately.</p>

      <p>The Flirtual Team</p>
      """,
      message
    )
  end

  def deliver(%User{} = user, :confirm_email, token) do
    action_url =
      Application.fetch_env!(:flirtual, :frontend_origin)
      |> URI.merge("/confirm-email?token=" <> token)
      |> URI.to_string()

    Mailer.send(
      user,
      "Confirm your email address",
      """
      Please confirm your email address:
      #{action_url}
      """,
      """
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
      """,
      action_url
    )
  end
end

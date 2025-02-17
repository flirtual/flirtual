defmodule Flirtual.User.Email do
  alias Flirtual.User
  import Flirtual.Gettext

  def deliver(%User{} = user, :suspended, message) do
    language = user.preferences.language || "en"

    Gettext.with_locale(language, fn ->
      %{
        "user_id" => user.id,
        "from" => "moderation@flirtu.al",
        "subject" => dgettext("emails", "suspended.subject"),
        "language" => language,
        "type" => "transactional",
        "body_text" => dgettext("emails", "suspended.body_text", message: message),
        "body_html" => dgettext("emails", "suspended.body_html", message: message)
      }
      |> Flirtual.ObanWorkers.Email.new()
      |> Oban.insert()
    end)
  end

  def deliver(%User{} = user, :confirm_email, token) do
    language = user.preferences.language || "en"

    Gettext.with_locale(language, fn ->
      action_url =
        Application.fetch_env!(:flirtual, :frontend_origin)
        |> URI.merge("/confirm-email")
        |> URI.append_query("token=#{token}")
        |> URI.append_query("language=#{language}")
        |> URI.to_string()

      %{
        "user_id" => user.id,
        "subject" => dgettext("emails", "confirm_email.subject"),
        "type" => "transactional",
        "action_url" => action_url,
        "body_text" => dgettext("emails", "confirm_email.body_text", action_url: action_url),
        "body_html" => """
        #{dgettext("emails", "confirm_email.body_html", action_url: action_url)}

        <script type="application/ld+json">
        {
          "@context": "http://schema.org",
          "@type": "EmailMessage",
          "description": "#{dgettext("emails", "confirm_email.subject")}",
          "potentialAction": {
            "@type": "ViewAction",
            "url": "#{action_url}",
            "name": "#{dgettext("emails", "continue")}"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Flirtual",
            "url": "#{URI.to_string(Application.fetch_env!(:flirtual, :frontend_origin))}"
          }
        }
        </script>
        """
      }
      |> Flirtual.ObanWorkers.Email.new()
      |> Oban.insert()
    end)
  end

  def deliver(%User{} = user, :reset_password, token) do
    language = user.preferences.language || "en"

    Gettext.with_locale(language, fn ->
      action_url =
        Application.fetch_env!(:flirtual, :frontend_origin)
        |> URI.merge("/forgot/" <> token)
        |> URI.append_query("language=#{language}")
        |> URI.to_string()

      %{
        "user_id" => user.id,
        "subject" => dgettext("emails", "reset_password.subject"),
        "type" => "transactional",
        "action_url" => action_url,
        "body_text" => dgettext("emails", "reset_password.body_text", action_url: action_url),
        "body_html" => """
        #{dgettext("emails", "reset_password.body_html", action_url: action_url)}

        <script type="application/ld+json">
        {
          "@context": "http://schema.org",
          "@type": "EmailMessage",
          "description": "#{dgettext("emails", "reset_password.subject")}",
          "potentialAction": {
            "@type": "ViewAction",
            "url": "#{action_url}",
            "name": "#{dgettext("emails", "continue")}"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Flirtual",
            "url": "#{URI.to_string(Application.fetch_env!(:flirtual, :frontend_origin))}"
          }
        }
        </script>
        """
      }
      |> Flirtual.ObanWorkers.Email.new()
      |> Oban.insert()
    end)
  end
end

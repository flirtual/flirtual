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
        "language" => language,
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
        "language" => language,
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

  def deliver(%User{} = user, :password_changed) do
    language = user.preferences.language || "en"

    action_url =
      Application.fetch_env!(:flirtual, :frontend_origin)
      |> URI.merge("/forgot")
      |> URI.append_query("language=#{language}")
      |> URI.to_string()

    Gettext.with_locale(language, fn ->
      %{
        "user_id" => user.id,
        "from" => "security@flirtu.al",
        "language" => language,
        "type" => "transactional",
        "action_url" => action_url,
        "subject" => dgettext("emails", "password_changed.subject"),
        "body_text" => dgettext("emails", "password_changed.body_text", action_url: action_url),
        "body_html" => dgettext("emails", "password_changed.body_html", action_url: action_url)
      }
      |> Flirtual.ObanWorkers.Email.new()
      |> Oban.insert()
    end)
  end

  def deliver(%User{previous_email: nil}, :email_changed), do: {:ok, nil}

  def deliver(%User{} = user, :email_changed) do
    language = user.preferences.language || "en"

    Gettext.with_locale(language, fn ->
      %{
        "recipient" => user.previous_email,
        "from" => "security@flirtu.al",
        "language" => language,
        "type" => "transactional",
        "subject" => dgettext("emails", "email_changed.subject"),
        "body_text" => dgettext("emails", "email_changed.body_text", email: user.email),
        "body_html" => dgettext("emails", "email_changed.body_html", email: user.email)
      }
      |> Flirtual.ObanWorkers.Email.new()
      |> Oban.insert()
    end)
  end
end

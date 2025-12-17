defmodule Flirtual.User.Email do
  use Gettext, backend: Flirtual.Gettext

  alias Flirtual.Subscription
  alias Flirtual.User

  def deliver(%User{} = user, :suspended, message) do
    language = user.preferences.language || "en"
    message = message |> Plug.HTML.html_escape()

    Gettext.with_locale(language, fn ->
      %{
        "user_id" => user.id,
        "from" => "moderation@flirtu.al",
        "subject" => dgettext("notifications", "suspended.subject"),
        "language" => language,
        "type" => "transactional",
        "body_text" => dgettext("notifications", "suspended.body_text", message: message),
        "body_html" => dgettext("notifications", "suspended.body_html", message: message)
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
        |> URI.append_query("=#{token}")
        |> URI.to_string()

      %{
        "user_id" => user.id,
        "subject" => dgettext("notifications", "confirm_email.subject"),
        "language" => language,
        "type" => "transactional",
        "action_url" => action_url,
        "body_text" =>
          dgettext("notifications", "confirm_email.body_text", action_url: action_url),
        "body_html" => """
        #{dgettext("notifications", "confirm_email.body_html", action_url: action_url)}

        <script type="application/ld+json">
        {
          "@context": "http://schema.org",
          "@type": "EmailMessage",
          "description": "#{dgettext("notifications", "confirm_email.subject")}",
          "potentialAction": {
            "@type": "ViewAction",
            "url": "#{action_url}",
            "name": "#{dgettext("notifications", "continue")}"
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
        |> URI.merge("/forgot")
        |> URI.append_query("=#{token}")
        |> URI.to_string()

      %{
        "user_id" => user.id,
        "subject" => dgettext("notifications", "reset_password.subject"),
        "language" => language,
        "type" => "transactional",
        "action_url" => action_url,
        "body_text" =>
          dgettext("notifications", "reset_password.body_text", action_url: action_url),
        "body_html" => """
        #{dgettext("notifications", "reset_password.body_html", action_url: action_url)}

        <script type="application/ld+json">
        {
          "@context": "http://schema.org",
          "@type": "EmailMessage",
          "description": "#{dgettext("notifications", "reset_password.subject")}",
          "potentialAction": {
            "@type": "ViewAction",
            "url": "#{action_url}",
            "name": "#{dgettext("notifications", "continue")}"
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

  def deliver(%User{} = user, :verification_code, code) do
    language = user.preferences.language || "en"

    Gettext.with_locale(language, fn ->
      %{
        "user_id" => user.id,
        "from" => "security@flirtu.al",
        "language" => language,
        "type" => "transactional",
        "subject" => dgettext("notifications", "verification_code.subject", code: code),
        "body_text" => dgettext("notifications", "verification_code.body_text", code: code),
        "body_html" => dgettext("notifications", "verification_code.body_html", code: code)
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
      |> URI.to_string()

    Gettext.with_locale(language, fn ->
      %{
        "user_id" => user.id,
        "from" => "security@flirtu.al",
        "language" => language,
        "type" => "transactional",
        "action_url" => action_url,
        "subject" => dgettext("notifications", "password_changed.subject"),
        "body_text" =>
          dgettext("notifications", "password_changed.body_text", action_url: action_url),
        "body_html" =>
          dgettext("notifications", "password_changed.body_html", action_url: action_url)
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
        "to" => user.previous_email,
        "from" => "security@flirtu.al",
        "language" => language,
        "type" => "transactional",
        "subject" => dgettext("notifications", "email_changed.subject"),
        "body_text" => dgettext("notifications", "email_changed.body_text", email: user.email),
        "body_html" => dgettext("notifications", "email_changed.body_html", email: user.email)
      }
      |> Flirtual.ObanWorkers.Email.new()
      |> Oban.insert()
    end)
  end

  def deliver(%User{} = user, :new_match, options) do
    language = user.preferences.language || "en"

    Gettext.with_locale(language, fn ->
      conversation_id = Keyword.fetch!(options, :conversation_id)
      match_kind = Keyword.fetch!(options, :match_kind)

      target_user = Keyword.fetch!(options, :target_user)
      target_thumbnail = User.avatar_url(target_user, "icon")
      target_display_name = User.display_name(target_user) |> Plug.HTML.html_escape()

      action_url =
        Application.fetch_env!(:flirtual, :frontend_origin)
        |> URI.merge("/matches/" <> conversation_id)
        |> URI.to_string()

      %{
        "user_id" => user.id,
        "type" => "marketing",
        "subject" =>
          if(match_kind == :love,
            do: dgettext("notifications", "its_a_match"),
            else: dgettext("notifications", "its_a_match_homie")
          ),
        "action_url" => action_url,
        "body_text" => """
        #{if(match_kind == :love,
        do: dgettext("notifications", "liked_you", name: target_display_name),
        else: dgettext("notifications", "homied_you", name: target_display_name))}

        #{dgettext("notifications", "new_match.looking_for_date_ideas")}

        #{action_url}
        """,
        "body_html" => """
        #{if(match_kind == :love,
        do: "<p>#{dgettext("notifications", "liked_you", name: target_display_name)}</p>",
        else: "<p>#{dgettext("notifications", "homied_you", name: target_display_name)}</p>")}

        <p>#{dgettext("notifications", "new_match.looking_for_date_ideas_html")}</p>

        <p>
          <a href="#{action_url}" class="btn" style="display: inline-block; padding: 12px 16px; font-size: 18px">
            <img src="#{target_thumbnail}" style="margin-right: 10px; width: 38px; height: 38px; border-radius: 50%; vertical-align: middle" />
            <span style="vertical-align: middle">#{dgettext("notifications", "message")}</span>
          </a>
        </p>

        <script type="application/ld+json">
        {
          "@context": "http://schema.org",
          "@type": "EmailMessage",
          "description": "#{dgettext("notifications", "send_them_a_message")}",
          "potentialAction": {
            "@type": "ViewAction",
            "url": "#{action_url}",
            "name": "#{dgettext("notifications", "message")}"
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
      |> Flirtual.ObanWorkers.Email.new(
        unique: [period: 60 * 60, states: [:available, :scheduled, :executing, :completed]]
      )
      |> Oban.insert()
    end)
  end

  def deliver(%User{} = user, :like_digest, options) do
    language = user.preferences.language || "en"

    Gettext.with_locale(language, fn ->
      likes = Keyword.fetch!(options, :likes)
      like_count = length(likes)

      is_premium? = Subscription.active?(user.subscription)

      action_url =
        if(is_premium?,
          do:
            Application.fetch_env!(:flirtual, :frontend_origin)
            |> URI.merge("/likes")
            |> URI.to_string(),
          else:
            Application.fetch_env!(:flirtual, :frontend_origin)
            |> URI.merge("/browse")
            |> URI.to_string()
        )

      thumbnails =
        likes
        |> Enum.take(3)
        |> Enum.reverse()
        |> Enum.map(fn user_id ->
          if is_premium? do
            user_id
            |> User.get()
            |> User.avatar_url("icon")
          else
            user_id
            |> User.get()
            |> User.avatar_url("blur")
          end
        end)

      %{
        "user_id" => user.id,
        "type" => "marketing",
        "subject" =>
          dngettext("notifications", "someone_liked_you", "x_people_liked_you", like_count, %{
            count: like_count
          }),
        "action_url" => action_url,
        "body_text" => """
        #{dngettext("notifications", "this_week_1_person_liked_you", "this_week_x_people_liked_you", like_count, %{count: like_count})}

        #{if(is_premium?,
        do: dgettext("notifications", "see_who_likes_you"),
        else: dgettext("notifications", "browse_profiles_to_see_if_its_a_match"))}
        #{action_url}

        #{if(is_premium?, do: "", else: dgettext("notifications", "or_upgrade_to_premium"))}
        """,
        "body_html" => """
        <p>#{dngettext("notifications", "this_week_1_person_liked_you", "this_week_x_people_liked_you", like_count, %{count: like_count})}</p>

        <p>#{if(is_premium?,
        do: "<a href=\"#{action_url}\">#{dgettext("notifications", "see_who_likes_you")}</a>",
        else: dgettext("notifications", "browse_profiles_to_see_if_its_a_match_html", action_url: action_url))}
        </p>

        #{Enum.map_join(thumbnails, "", &"<img src=\"#{&1}\" style=\"width: 50px; height: 50px; border-radius: 50%; margin: 0 5px;\" />")}

        <script type="application/ld+json">
        {
          "@context": "http://schema.org",
          "@type": "EmailMessage",
          "description": "#{if(is_premium?,
        do: dgettext("notifications", "see_who_likes_you"),
        else: dgettext("notifications", "browse_profiles"))}",
          "potentialAction": {
            "@type": "ViewAction",
            "url": "#{action_url}",
            "name": "#{dgettext("notifications", "continue")}"
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
      |> Flirtual.ObanWorkers.Email.new(priority: 2, unique: [period: 60 * 60 * 24 * 6])
      |> Oban.insert()
    end)
  end

  def deliver(%User{} = user, :deletion_reminder, days: days) do
    language = user.preferences.language || "en"

    Gettext.with_locale(language, fn ->
      action_url =
        Application.fetch_env!(:flirtual, :frontend_origin)
        |> URI.merge("/login")
        |> URI.to_string()

      {subject, body_text, body_html} = get_reminder(days, action_url)

      %{
        "user_id" => user.id,
        "type" => "transactional",
        "subject" => subject,
        "action_url" => action_url,
        "body_text" => body_text,
        "body_html" => body_html
      }
      |> Flirtual.ObanWorkers.Email.new()
      |> Oban.insert()
    end)
  end

  defp get_reminder(670, action_url) do
    {
      dgettext("notifications", "deletion_reminder_670.subject"),
      dgettext("notifications", "deletion_reminder_670.body_text", action_url: action_url),
      dgettext("notifications", "deletion_reminder_670.body_html", action_url: action_url)
    }
  end

  defp get_reminder(700, action_url) do
    {
      dgettext("notifications", "deletion_reminder_700.subject"),
      dgettext("notifications", "deletion_reminder_700.body_text", action_url: action_url),
      dgettext("notifications", "deletion_reminder_700.body_html", action_url: action_url)
    }
  end

  defp get_reminder(723, action_url) do
    {
      dgettext("notifications", "deletion_reminder_723.subject"),
      dgettext("notifications", "deletion_reminder_723.body_text", action_url: action_url),
      dgettext("notifications", "deletion_reminder_723.body_html", action_url: action_url)
    }
  end
end

defmodule Flirtual.Mailer do
  use Swoosh.Mailer, otp_app: :flirtual
  use Gettext, backend: Flirtual.Gettext

  import Swoosh.Email

  alias Flirtual.Brand

  defp get_origin() do
    Application.fetch_env!(:flirtual, :frontend_origin)
  end

  defp get_urls() do
    origin = get_origin()

    %{
      home: URI.to_string(origin),
      unsubscribe:
        origin
        |> URI.merge("/settings/notifications")
        |> URI.to_string()
    }
  end

  defp company, do: Brand.name()

  defp social_label(:discord), do: dgettext("notifications", "discord")
  defp social_label(:x), do: dgettext("notifications", "x")
  defp social_label(:bluesky), do: dgettext("notifications", "bluesky")
  defp social_label(:instagram), do: dgettext("notifications", "instagram")

  defp format_text_body(body_text) do
    urls = get_urls()

    socials = Enum.map(Brand.socials(), fn {name, url} -> "#{social_label(name)}: #{url}\n" end)
    address = if Brand.legal_address(), do: "#{Brand.legal_address()}\n", else: ""

    """
    #{body_text}

    ---
    #{urls.home}

    #{socials}#{dgettext("notifications", "unsubscribe")}: #{urls.unsubscribe}

    © #{Date.utc_today().year} #{company()}
    #{address}\
    """
  end

  defp html_logo do
    case {Brand.logo_dark_url(), Brand.logo_light_url()} do
      {dark, light} when is_binary(dark) and is_binary(light) ->
        """
        <img style="max-height: 48px" class="dark-only" src="#{dark}" alt="#{company()}" />
        <img style="max-height: 48px" class="light-only" src="#{light}" alt="#{company()}" />
        """

      {dark, light} when is_binary(dark) or is_binary(light) ->
        ~s(<img style="max-height: 48px" src="#{dark || light}" alt="#{company()}" />)

      _ ->
        ~s(<span style="font-family: 'Montserrat', sans-serif; font-size: 32px; font-weight: 700">#{company()}</span>)
    end
  end

  defp html_socials do
    case Brand.socials() do
      [] ->
        ""

      socials ->
        Enum.map_join(socials, "\n", fn {name, url} ->
          ~s(<a href="#{url}">#{social_label(name)}</a>)
        end) <> "<br />"
    end
  end

  defp format_html_body(body_html, subject, action_url) do
    urls = get_urls()

    """
    <!doctype html>
    <html>
      <head>
        <title>[#{company()}] #{subject}</title>
        <meta http-equiv="Content-Type" content="text/html; charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1">
        <base target="_blank">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap" rel="stylesheet">
        <style>
          body {
            background-color: #{Brand.background_color()};
            font-family: "Nunito", 'Helvetica Neue', 'Segoe UI', Helvetica, sans-serif;
            font-size: 16px;
            line-height: 26px;
            margin: 0;
            color: #444;
          }

          .montserrat, h1, .btn {
            font-family: "Montserrat", 'Helvetica Neue', 'Segoe UI', Helvetica, sans-serif;
          }

          h1 {
            font-size: 20px;
            margin: 0;
            padding: 0;
          }

          pre {
            background: #f4f4f4f4;
            padding: 2px;
          }

          table {
            width: 100%;
            border: 1px solid #ddd;
          }
          table td {
            border-color: #ddd;
            padding: 5px;
          }

          .wrap {
            padding: 15px 30px;
            max-width: 525px;
            margin: 0 auto;
            border-radius: 12px;
          }

          .button {
            background: #0055d4;
            border-radius: 3px;
            text-decoration: none !important;
            color: #fff !important;
            font-weight: bold;
            padding: 10px 30px;
            display: inline-block;
          }
          .button:hover {
            background: #111;
          }

          .main {
            background-color: #f5f5f5;
            max-width: 525px;
            margin: 0 auto;
            border-radius: 12px;
            box-shadow: rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 3px 1px -2px, rgba(0, 0, 0, 0.2) 0px 1px 5px 0px;
          }

          .footer {
            padding: 8px;
            text-align: center;
            font-size: 10px;
            text-transform: uppercase;
            max-width: 525px;
            margin: 0 auto;
          }

          .footer p {
            line-height: 18px;
          }

          .footer a {
            color: #444;
            margin-right: 5px;
            text-decoration: underline;
            font-weight: normal;
          }

          .gutter {
            padding: 24px 32px;
          }

          img {
            max-width: 100%;
            height: auto;
          }

          a {
            color: #{Brand.date_color(1)};
            font-weight: bold;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }

          .btn {
            display: inline-block;
            padding: 8px 24px;
            border-radius: 12px;
            background-color: #{Brand.date_color(0)};
            background-image: linear-gradient(to right, #{Brand.date_color(0)}, #{Brand.date_color(1)});
            color: #f5f5f5;
            box-shadow: rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 3px 1px -2px, rgba(0, 0, 0, 0.2) 0px 1px 5px 0px;
          }
          .btn:hover {
            text-decoration: none;
          }

          p.action-link {
            display: inline-block;
            line-height: 14px;
          }
          p.action-link a {
            text-transform: none;
            word-break: break-all;
          }

          @media screen and (max-width: 600px) {
            .wrap {
              max-width: auto;
            }
            .gutter {
              padding: 10px;
            }
          }

          .ii a[href] {
            color: #{Brand.date_color(1)};
          }

          .footer .ii a[href] {
            color: #888;
          }

          .gradient {
            padding: 24px 32px;
            border-radius: 12px 12px 0 0;
            background-color: #{Brand.date_color(0)};
            background-image: linear-gradient(to right, #{Brand.date_color(0)}, #{Brand.date_color(1)});
            color: white;
          }

          .light-only {
            display: inline;
          }

          .dark-only {
            display: none;
          }

          @media (prefers-color-scheme: dark) {
            .light-only {
              display: none;
            }

            .dark-only {
              display: inline;
            }

            body {
              background-color: #111;
              color: #f5f5f5;
            }

            .main {
              background-color: #1e1e1e;
            }

            a {
              color: #{Brand.date_color(1)};
            }

            .ii a[href] {
              color: #{Brand.date_color(1)};
            }

            .footer a {
              color: #f5f5f5;
            }

            .gradient, .btn {
              background-color: #{Brand.date_dark_color(0)};
              background-image: linear-gradient(to right, #{Brand.date_dark_color(0)}, #{Brand.date_dark_color(1)});
            }
          }
        </style>
      </head>
      <body>
        <div class="gutter">&nbsp;</div>
        <a
          style="display: block; text-align: center; margin: auto; margin-bottom: 16px"
          href="#{urls.home}"
        >
          #{html_logo()}
        </a>
        <div class="main">
          <div class="gradient">
            <h1>#{subject}</h1>
          </div>
          <div class="wrap">
            #{body_html}
          </div>
        </div>
        <div class="footer">
          #{if action_url !== nil,
      do: "<p class=\"action-link\">#{dgettext("notifications", "if_the_link_does_not_work")}<br /><a href=\"#{action_url}\">#{action_url}</a></p>",
      else: ""}
          <p>
            #{html_socials()}
            <a href="#{urls.unsubscribe}">#{dgettext("notifications", "unsubscribe")}</a>
          </p>
          <p>
            &copy; #{Date.utc_today().year} #{company()}#{if Brand.legal_address(), do: "<br />\n#{Brand.legal_address()}"}
          </p>
        </div>
        <div class="gutter">&nbsp;</div>
      </body>
    </html>
    """
  end

  defp address(mailbox, type) do
    domains = Application.fetch_env!(:flirtual, __MODULE__)[:domains]
    "#{mailbox}@#{Map.get(domains, type) || Map.fetch!(domains, "transactional")}"
  end

  defp configuration_set(type) do
    sets = Application.fetch_env!(:flirtual, __MODULE__)[:configuration_sets]
    Map.get(sets, type) || Map.fetch!(sets, "transactional")
  end

  defp reply_address(mailbox) do
    "#{mailbox}@#{Application.fetch_env!(:flirtual, __MODULE__)[:reply_domain]}"
  end

  # subject, body_text, body_html, action_url \\ nil
  def send(recipient, options) do
    type = Keyword.fetch!(options, :type)
    from = address("noreply", type)
    configuration_set = configuration_set(type)
    kind = Keyword.get(options, :kind)
    reply_to_mailbox = Keyword.get(options, :reply_to)
    subject = Keyword.fetch!(options, :subject)
    action_url = Keyword.get(options, :action_url)
    unsubscribe_token = Keyword.get(options, :unsubscribe_token)
    language = Keyword.get(options, :language) || "en"

    Gettext.with_locale(language, fn ->
      email =
        new()
        |> to(recipient)
        |> from({company(), from})
        |> put_provider_option(:configuration_set_name, configuration_set)
        |> put_provider_option(
          :tags,
          [{"ses:feedback-id-a", kind}, {"ses:feedback-id-b", configuration_set}]
          |> Enum.reject(fn {_, value} -> is_nil(value) end)
          |> Enum.map(fn {name, value} -> %{name: name, value: value} end)
        )
        |> subject(subject)
        |> text_body(
          Keyword.fetch!(options, :body_text)
          |> format_text_body()
        )
        |> html_body(
          Keyword.fetch!(options, :body_html)
          |> format_html_body(
            subject,
            action_url
          )
        )

      email =
        if reply_to_mailbox do
          reply_to(email, reply_address(reply_to_mailbox))
        else
          email
        end

      email =
        if unsubscribe_token do
          email
          |> header(
            "List-Unsubscribe",
            "<" <>
              (Application.fetch_env!(:flirtual, :origin)
               |> URI.merge("/v1/unsubscribe")
               |> URI.append_query("token=#{unsubscribe_token}")
               |> URI.to_string()) <>
              ">"
          )
          |> header("List-Unsubscribe-Post", "List-Unsubscribe=One-Click")
        else
          email
        end

      with {:ok, _metadata} <-
             deliver(email) do
        {:ok, email}
      end
    end)
  end
end

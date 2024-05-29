defmodule Flirtual.Mailer do
  use Swoosh.Mailer, otp_app: :flirtual

  import Swoosh.Email

  defp get_origin() do
    Application.fetch_env!(:flirtual, :frontend_origin)
  end

  defp get_urls() do
    origin = get_origin()

    x_url = "https://x.com/getflirtual"
    discord_url = origin |> URI.merge("/discord") |> URI.to_string()
    unsubscribe_url = origin |> URI.merge("/settings/notifications") |> URI.to_string()

    %{x_url: x_url, discord_url: discord_url, unsubscribe_url: unsubscribe_url}
  end

  @company "Flirtual"
  @company_address "6d - 7398 Yonge St, #776 | Thornhill, ON | L4J 8J2 | Canada"

  defp format_text_body(body_text) do
    %{x_url: x_url, discord_url: discord_url, unsubscribe_url: unsubscribe_url} =
      get_urls()

    """
    #{body_text}

    ---
    X: #{x_url}
    Discord: #{discord_url}
    Unsubscribe: #{unsubscribe_url}

    © #{Date.utc_today().year} #{@company}
    #{@company_address}
    """
  end

  defp format_html_body(body_html, subject, action_url) do
    %{x_url: x_url, discord_url: discord_url, unsubscribe_url: unsubscribe_url} =
      get_urls()

    """
    <!doctype html>
    <html>
      <head>
        <title>[Flirtual] #{subject}</title>
        <meta http-equiv="Content-Type" content="text/html; charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1">
        <base target="_blank">
        <style>
          body {
            background-color: #fffaf0;
            font-family: 'Helvetica Neue', 'Segoe UI', Helvetica, sans-serif;
            font-size: 15px;
            line-height: 26px;
            margin: 0;
            color: #444;
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
            padding: 30px;
          }

          img {
            max-width: 100%;
            height: auto;
          }

          a {
            color: #e9658b;
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
            background-color: #ff8975;
            background-image: linear-gradient(to right, #ff8975, #e9658b);
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
            color: #e9658b;
          }

          .footer .ii a[href] {
            color: #888;
          }

          .gradient {
            padding: 30px;
            border-radius: 12px 12px 0 0;
            background-color: #ff8975;
            background-image: linear-gradient(to right, #ff8975, #e9658b);
          }

          @media (prefers-color-scheme: dark) {
            body {
              background-color: #111;
              color: #f5f5f5;
            }

            .main {
              background-color: #1e1e1e;
            }

            a {
              color: #e9658b;
            }

            .ii a[href] {
              color: #e9658b;
            }

            .footer a {
              color: #f5f5f5;
            }

            .gradient, .btn {
              background-color: #b24592;
              background-image: linear-gradient(to right, #b24592, #e9658b);
            }
          }
        </style>
      </head>
      <body>
        <div class="gutter">&nbsp;</div>
        <div class="main">
          <div class="gradient">
            <a href="https://flirtu.al">
              <img src="https://media.news.flirtu.al/flirtual-white.png" alt="Flirtual" />
            </a>
          </div>
          <div class="wrap">
            <h1>#{subject}</h1>
            #{body_html}
          </div>
        </div>
        <div class="footer">
          #{if action_url !== nil, do: "<p class=\"action-link\">If the link above doesn't work, try copying this URL into your browser:<br /><a href=\"#{action_url}\">#{action_url}</a></p>", else: ""}
          <p>
            <a href="#{x_url}">X</a>
            <a href="#{discord_url}">Discord</a><br />
            <a href="#{unsubscribe_url}">Unsubscribe</a>
          </p>
          <p>
            &copy; #{Date.utc_today().year} #{@company}<br />
            #{@company_address}
          </p>
        </div>
        <div class="gutter">&nbsp;</div>
      </body>
    </html>
    """
  end

  # subject, body_text, body_html, action_url \\ nil
  def send(recipient, options) do
    from = Keyword.get(options, :from, "noreply@flirtu.al")
    subject = Keyword.fetch!(options, :subject)
    action_url = Keyword.get(options, :action_url)
    unsubscribe_token = Keyword.get(options, :unsubscribe_token)

    email =
      new()
      |> to(recipient)
      |> from({"Flirtual", from})
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
      if unsubscribe_token do
        email
        |> header(
          "List-Unsubscribe",
          "<https://api.flirtu.al/v1/unsubscribe?token=" <> unsubscribe_token <> ">"
        )
        |> header("List-Unsubscribe-Post", "List-Unsubscribe=One-Click")
      else
        email
      end

    with {:ok, _metadata} <-
           deliver(email) do
      {:ok, email}
    end
  end
end

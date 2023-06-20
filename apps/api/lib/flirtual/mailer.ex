defmodule Flirtual.Mailer do
  use Swoosh.Mailer, otp_app: :flirtual

  import Swoosh.Email

  defp get_origin() do
    Application.fetch_env!(:flirtual, :frontend_origin)
  end

  defp get_urls() do
    origin = get_origin()

    twitter_url = "https://twitter.com/getflirtual"
    discord_url = origin |> URI.merge("/discord") |> URI.to_string()
    unsubscribe_url = origin |> URI.merge("/settings/notifications") |> URI.to_string()

    %{twitter_url: twitter_url, discord_url: discord_url, unsubscribe_url: unsubscribe_url}
  end

  @company "Studio Paprika"
  @company_address "530 Divisadero Street | San Francisco, CA | 94117 | USA"

  defp format_text_body(body_text) do
    %{twitter_url: twitter_url, discord_url: discord_url, unsubscribe_url: unsubscribe_url} = get_urls()

    """
    #{body_text}
    ---
    Twitter: #{twitter_url}
    Discord: #{discord_url}
    Unsubscribe: #{unsubscribe_url}

    © #{Date.utc_today().year} #{@company}
    #{@company_address}
    """
  end

  defp format_html_body(body_html, subject, action_url) do
    %{twitter_url: twitter_url, discord_url: discord_url, unsubscribe_url: unsubscribe_url} = get_urls()

    """
    <!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml" class=" js flexbox flexboxlegacy canvas canvastext webgl no-touch geolocation postmessage websqldatabase indexeddb hashchange history draganddrop websockets rgba hsla multiplebgs backgroundsize borderimage borderradius boxshadow textshadow opacity cssanimations csscolumns cssgradients cssreflections csstransforms csstransforms3d csstransitions fontface generatedcontent video audio localstorage sessionstorage webworkers no-applicationcache svg inlinesvg smil svgclippaths responsejs " style="" lang="en">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=" utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="robots" content="noindex, nofollow">
        <title>[Flirtual] #{subject}</title>
        <style>.btn { color: #e9658b }</style>
      </head>
      <body style="margin: 0 !important;padding: 0 !important;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;font-family: brandon-grotesque, Roboto, Verdana, Arial, sans-serif;height: 100% !important;width: 100% !important;-webkit-font-smoothing: antialiased !important;font-smoothing: antialiased !important;" class="ui-sortable">
        <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0" align="center" style="-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;border-collapse: collapse !important;">
          <tbody>
            <tr>
              <td width="100%" valign="top" align="center" style="-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;">
                <center>
                  <table data-section-wrapper="1" width="100%" height="100%" cellspacing="0" cellpadding="0" border="0" style="-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;border-collapse: collapse !important;">
                    <tbody>
                      <tr data-section="1">
                        <td width="100%" valign="top" height="100%" align="center" style="-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;">
                          <!--[if (gte mso 9)|(IE)]>
                          <table align="center" border="0" cellspacing="0" cellpadding="0" width="660">
                            <tr>
                              <td align="center" valign="top" width="660">
                                <![endif]-->
                                <div data-slot-container="1" class="ui-sortable">
                                  <div data-slot="text">
                                    <table align="center" bgcolor="#00bf9a" border="0" cellpadding="0" cellspacing="0&quot;" style="max-width: 660px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;border-collapse: collapse !important;" width="100%">
                                      <tbody>
                                        <tr>
                                          <td align="center" bgcolor="#e9658b" class="shrinker" height="124" style="background-repeat: no-repeat;background-size: 100%;background-color: #e9658b;background-image: linear-gradient(110deg, #ff8975 10%, #e9658b 90%); max-width: 660px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;" valign="top">
                                            <table align="center" border="0" cellpadding="0" cellspacing="0" class="shrinker" style="width: 100%;max-width: 550px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;border-collapse: collapse !important;" width="100%">
                                              <tbody>
                                                <tr>
                                                  <td height="60" style="font-size: 60px;line-height: 60px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;">&nbsp;</td>
                                                </tr>
                                                <tr>
                                                  <td align="center" valign="top" style="-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;">
                                                    <a href="#{get_origin() |> URI.to_string()}" style="text-decoration: none;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;" target="_blank">
                                                      &nbsp;<img src="#{get_origin() |> URI.merge("/images/brand/white.png") |> URI.to_string()}" style="padding: 0px;border: medium none;width: 335px;height: 91.249px;line-height: 100%;outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;" alt="Flirtual" class="fr-fil fr-dib" border="0" width="335" height="91.249">&nbsp;
                                                    </a>
                                                  </td>
                                                </tr>
                                                <tr>
                                                  <td height="30" style="font-size: 30px;line-height: 30px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;">&nbsp;<br><br></td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            </tbody>
                          </table>
                          <table data-section-wrapper="1" width="100%" height="100%" cellspacing="0" cellpadding="0" border="0" style="-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;border-collapse: collapse !important;">
                            <tbody>
                              <tr data-section="1">
                                <td width="100%" valign="top" height="100%" align="center" style="-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;">
                                  <!--[if (gte mso 9)|(IE)]>
                                  <table align="center" border="0" cellspacing="0" cellpadding="0" width="660">
                                    <tr>
                                      <td align="center" valign="top" width="660">
                                        <![endif]-->
                                        <table style="max-width: 660px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;border-collapse: collapse !important;" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f0f0f0" align="center">
                                          <tbody>
                                            <tr>
                                              <td style="font-family: brandon-grotesque, Roboto, Verdana, Arial, sans-serif;background: #f0f0f0;color: #212121;padding: 0 15px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;" class="shrinker ui-sortable" data-slot-container="1" align="center">
                                                <div data-slot="text">
                                                  <table align="center" border="0" cellpadding="0" cellspacing="0" style="max-width: 550px;background: #ffffff;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;border-collapse: collapse !important;" width="100%">
                                                    <tbody>
                                                      <tr>
                                                        <td height="30" style="font-size: 30px;line-height: 30px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;">&nbsp;<br></td>
                                                      </tr>
                                                      <tr>
                                                        <td align="center" style="padding: 0 30px;text-align: left;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;" valign="top">
                                                          <h1 style="font-family: filicudi-solid, Roboto, Verdana, Arial, sans-serif;">#{subject}</h1>
                                                          #{body_html}
                                                        </td>
                                                      </tr>
                                                      <tr>
                                                        <td style="font-size: 30px;line-height: 30px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;" height="30">&nbsp;<br></td>
                                                      </tr>
                                                      <tr>
                                                        <td style="padding: 0 30px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;" valign="top" align="center">
                                                          <table style="max-width: 550px;background: #ffffff;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;border-collapse: collapse !important;" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
                                                            <tbody>
                                                              <tr>
                                                                <td style="font-size: 0px;line-height: 0px;border-bottom: 1px solid #e8e8e8;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;" height="0">&nbsp;<br></td>
                                                              </tr>
                                                            </tbody>
                                                          </table>
                                                        </td>
                                                      </tr>
                                                    </tbody>
                                                  </table>
                                                </div>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                        <!--[if (gte mso 9)|(IE)]>
                                      </td>
                                    </tr>
                                  </table>
                                  <![endif]-->
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          #{if action_url !== nil,
      do: """
      <table data-section-wrapper="1" width="100%" height="100%" cellspacing="0" cellpadding="0" border="0" style="-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;border-collapse: collapse !important;">
        <tbody>
          <tr data-section="1">
            <td width="100%" valign="top" height="100%" align="center" style="-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;">
              <!--[if (gte mso 9)|(IE)]>
              <table align="center" border="0" cellspacing="0" cellpadding="0" width="660">
                <tr>
                  <td align="center" valign="top" width="660">
                    <![endif]-->
                    <table style="max-width: 660px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;border-collapse: collapse !important;" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f0f0f0" align="center">
                      <tbody>
                        <tr>
                          <td style="font-family: brandon-grotesque, Roboto, Verdana, Arial, sans-serif;color: #212121;text-transform: uppercase;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;" data-slot-container="1" class="ui-sortable" align="center">
                            <div data-slot="text">
                              <p style="font-family: brandon-grotesque, Roboto, Verdana, Arial, sans-serif; font-size:12px; line-height:18px; color:#212121; text-transform: uppercase; padding:0 1rem; margin:0;">
                                <span style="font-size:9px;">
                                  If the link above doesn't work, try copying this URL into your browser:
                                  <br/>
                                  <a href="#{action_url}" style="text-transform: none;word-break: break-all">#{action_url}</a>
                                </span>
                              </p>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <!--[if (gte mso 9)|(IE)]>
                  </td>
                </tr>
              </table>
              <![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
      """,
      else: ""}
                          <table data-section-wrapper="1" width="100%" height="100%" cellspacing="0" cellpadding="0" border="0" style="-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;border-collapse: collapse !important;">
                            <tbody>
                              <tr data-section="1">
                                <td width="100%" valign="top" height="100%" align="center" style="-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;">
                                  <!--[if (gte mso 9)|(IE)]>
                                  <table align="center" border="0" cellspacing="0" cellpadding="0" width="660">
                                    <tr>
                                      <td align="center" valign="top" width="660">
                                        <![endif]-->
                                        <table style="max-width: 660px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;border-collapse: collapse !important;" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f0f0f0" align="center">
                                          <tbody>
                                            <tr>
                                              <td style="font-size: 15px;line-height: 15px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;" height="15">&nbsp;</td>
                                            </tr>
                                            <tr>
                                              <td style="font-family: brandon-grotesque, Roboto, Verdana, Arial, sans-serif;color: #212121;text-transform: uppercase;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;" data-slot-container="1" class="ui-sortable" align="center">
                                                <div data-slot="text">
                                                  <a href="#{twitter_url}" rel="noopener noreferrer" style="font-family: brandon-grotesque, Roboto, Verdana, Arial, sans-serif;font-size: 10px;line-height: 20px;color: #212121;text-transform: uppercase;text-decoration: underline;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;" target="_blank">Twitter</a>
                                                  <span style="font-family:arial, sans-serif; font-size:10px; line-height:20px; color:#dddddd;">&nbsp;|&nbsp;</span>
                                                  <a href="#{discord_url}" rel="noopener noreferrer" style="font-family: brandon-grotesque, Roboto, Verdana, Arial, sans-serif;font-size: 10px;line-height: 20px;color: #212121;text-transform: uppercase;text-decoration: underline;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;" target="_blank">Discord</a>
                                                  <span style="font-family:arial, sans-serif; font-size:10px; line-height:20px; color:#dddddd;">&nbsp;|&nbsp;</span>
                                                  <a href="#{unsubscribe_url}" style="font-family: brandon-grotesque, Roboto, Verdana, Arial, sans-serif;font-size: 10px;line-height: 20px;color: #212121;text-transform: uppercase;text-decoration: underline;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;" target="_blank">Unsubscribe</a>
                                                </div>
                                              </td>
                                            </tr>
                                            <tr>
                                              <td style="font-size: 15px;line-height: 15px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;" height="15">&nbsp;</td>
                                            </tr>
                                          </tbody>
                                        </table>
                                        <!--[if (gte mso 9)|(IE)]>
                                      </td>
                                    </tr>
                                  </table>
                                  <![endif]-->
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <table data-section-wrapper="1" width="100%" height="100%" cellspacing="0" cellpadding="0" border="0" style="-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;border-collapse: collapse !important;">
                            <tbody>
                              <tr data-section="1">
                                <td width="100%" valign="top" height="100%" align="center" style="-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;">
                                  <!--[if (gte mso 9)|(IE)]>
                                  <table align="center" border="0" cellspacing="0" cellpadding="0" width="660">
                                    <tr>
                                      <td align="center" valign="top" width="660">
                                        <![endif]-->
                                        <table style="max-width: 660px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;border-collapse: collapse !important;" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f0f0f0" align="center">
                                          <tbody>
                                            <tr>
                                              <td style="font-family: brandon-grotesque, Roboto, Verdana, Arial, sans-serif;color: #212121;text-transform: uppercase;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;" data-slot-container="1" class="ui-sortable" align="center">
                                                <div data-slot="text">
                                                  <p style="font-family: brandon-grotesque, Roboto, Verdana, Arial, sans-serif; font-size:12px; line-height:18px; color:#212121; text-transform: uppercase; padding:0; margin:0;">
                                                    <span style="font-size:9px;">© #{Date.utc_today().year} #{@company}</span>
                                                    <br>
                                                    <span style="font-size:9px;">#{@company_address}</span></p>
                                                </div>
                                              </td>
                                            </tr>
                                            <tr>
                                              <td style="font-size: 20px;line-height: 20px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;mso-table-lspace: 0pt;mso-table-rspace: 0pt;" height="20">&nbsp;</td>
                                            </tr>
                                          </tbody>
                                        </table>
                                        <!--[if (gte mso 9)|(IE)]>
                                      </td>
                                    </tr>
                                  </table>
                                  <![endif]-->
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        <!--[if (gte mso 9)|(IE)]>
                        </td>
                      </tr>
                    </table>
                    <![endif]-->
                  </center>
                </td>
              </tr>
            </tbody>
          </table>
          <div style="display:none; white-space:nowrap; font:15px courier; line-height:0;">
          </div>
      </body>
    </html>
    """
  end

  # subject, body_text, body_html, action_url \\ nil
  def send(recipient, options) do
    from = Keyword.get(options, :from, "noreply@flirtu.al")
    subject = Keyword.fetch!(options, :subject)
    action_url = Keyword.get(options, :action_url)

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

    with {:ok, _metadata} <- deliver(email) do
      {:ok, email}
    end
  end
end

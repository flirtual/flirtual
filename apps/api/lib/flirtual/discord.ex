defmodule Flirtual.Discord do
  use Flirtual.Logger, :discord
  use Flirtual.Connection.Provider, :discord

  import Flirtual.Utilities

  alias Flirtual.Attribute
  alias Flirtual.Connection
  alias Flirtual.Report
  alias Flirtual.Subscription
  alias Flirtual.User
  alias Flirtual.User.Profile.Image

  @default_color 8_421_504
  @destructive_color 16_711_680
  @warn_color 16_636_429
  @success_color 65_280

  def config(key) do
    Application.get_env(:flirtual, Flirtual.Discord)[key]
  end

  def url(pathname) do
    "https://discord.com/api/" <> pathname
  end

  def webhook_token(name) do
    config(String.to_existing_atom("webhook_#{name}"))
  end

  def webhook(name, body) when is_atom(name) do
    log(:debug, ["webhook", name], body)

    case webhook_token(name) do
      token when token in [nil, ""] ->
        log(
          :warning,
          ["webhook", name],
          "Skipping webhook delivery due to missing or misconfigured token. If this is unintentional, make sure you have set the `DISCORD_WEBHOOK_#{name |> Atom.to_string() |> String.upcase()}` environment variable."
        )

        :ok

      token ->
        deliver_webhook(name, body, token)
    end
  end

  defp deliver_webhook(name, body, token) do
    with {:ok, %HTTPoison.Response{status_code: 204}} <-
           HTTPoison.post(
             url("webhooks/" <> token <> "?with_components=true"),
             Poison.encode!(body),
             [{"content-type", "application/json"}]
           ) do
      :ok
    else
      {:ok, %HTTPoison.Response{} = response} ->
        log(:error, ["webhook", name], response)
        {:error, :upstream}

      {:error, reason} ->
        {:error, reason}

      reason ->
        reason
    end
  end

  def authorize_url(_, %{prompt: prompt} = options) do
    URI.new(
      "https://discord.com/api/oauth2/authorize?" <>
        URI.encode_query(%{
          client_id: config(:client_id),
          redirect_uri: redirect_url!(redirect: Map.get(options, :redirect, true)),
          response_type: "code",
          scope: "identify email",
          prompt: prompt
        })
    )
  end

  def exchange_code(code, options \\ []) when is_binary(code) do
    with {:ok, %HTTPoison.Response{body: body}} <-
           HTTPoison.post(
             url("oauth2/token"),
             URI.encode_query(%{
               client_id: config(:client_id),
               client_secret: config(:client_secret),
               grant_type: "authorization_code",
               redirect_uri: redirect_url!(redirect: Keyword.get(options, :redirect, true)),
               code: code
             }),
             [{"content-type", "application/x-www-form-urlencoded"}]
           ),
         {:ok, body} <- Poison.decode(body),
         %{"access_token" => access_token, "token_type" => token_type} <- body do
      {:ok, "#{token_type} #{access_token}"}
    else
      %{"error" => "invalid_grant"} ->
        {:error, :invalid_grant}

      %{"error" => _} = body ->
        log(:critical, [:exchange_code], body)
        {:error, :upstream}

      reason ->
        log(:critical, [:exchange_code], reason)
        {:error, :upstream}
    end
  end

  def profile_avatar_url(%Connection{uid: id, avatar: avatar}),
    do: "https://cdn.discordapp.com/avatars/#{id}/#{avatar}.png"

  def profile_url(%Connection{uid: id}), do: "https://discord.com/users/#{id}"

  def get_profile(authorization) do
    with {:ok, %HTTPoison.Response{body: body}} <-
           HTTPoison.get(
             url("users/@me"),
             [{"authorization", authorization}]
           ),
         {:ok, profile} <- Poison.decode(body),
         %{
           "id" => id,
           "email" => email,
           "verified" => true,
           "username" => username,
           "discriminator" => discriminator,
           "avatar" => avatar
         } <- profile do
      {:ok,
       %{
         uid: id,
         email: email,
         display_name:
           if(discriminator == "0", do: username, else: "#{username}##{discriminator}"),
         avatar: avatar
       }}
    else
      %{"verified" => false} ->
        {:error, :unverified_email}

      reason ->
        log(:critical, [:get_profile], reason)
        {:error, :upstream}
    end
  end

  def md_display_name(%User{} = user),
    do: md_display_name(user, true)

  def md_display_name(%User{} = user, false),
    do: "#{User.display_name(user)} (#{user.id})"

  def md_display_name(%User{} = user, true),
    do: "[#{md_display_name(user, false)}](#{User.url(user)})"

  def webhook_author(%User{} = user),
    do: %{
      name: md_display_name(user, false),
      url: User.url(user) |> URI.to_string(),
      icon_url: User.avatar_url(user, "icon")
    }

  def webhook_author_footer(%User{} = user),
    do: %{
      text: md_display_name(user, false),
      icon_url: User.avatar_url(user, "icon")
    }

  def deliver_webhook(:suspended,
        user: %User{} = user,
        moderator: %User{} = moderator,
        reason: %Attribute{type: "ban-reason"} = reason,
        message: message
      ) do
    webhook(:moderation_actions, %{
      content:
        if(Subscription.active?(user.subscription), do: "<@&458465845887369243>", else: ""),
      embeds: [
        %{
          author: webhook_author(user),
          title: "User banned",
          description: message,
          fields:
            [
              %{
                name: "Reason",
                value: Map.get(Attribute.ban_reasons(), reason.id),
                inline: true
              }
            ] ++
              if(Subscription.active?(user.subscription),
                do: [
                  %{
                    name: "Active subscription",
                    value:
                      if(user.subscription.chargebee_id,
                        do:
                          "[Issue refund](https://flirtual.chargebee.com/d/subscriptions/#{user.subscription.chargebee_id})",
                        else:
                          if(user.subscription.stripe_id,
                            do:
                              "[Issue refund](https://dashboard.stripe.com/subscriptions/#{user.subscription.stripe_id})",
                            else:
                              if(user.subscription.google_id,
                                do:
                                  "[Issue refund](https://app.revenuecat.com/customers/cf0649d1/#{user.revenuecat_id})",
                                else:
                                  "[Send refund reminder](https://hello.flirtu.al/a/tickets/compose-email)"
                              )
                          )
                      )
                  }
                ],
                else: []
              ),
          color: @destructive_color,
          footer: webhook_author_footer(moderator),
          timestamp: DateTime.to_iso8601(user.banned_at)
        }
      ],
      components: [
        %{
          type: 1,
          components: [
            %{
              type: 2,
              label: "View profile",
              style: 5,
              url: User.url(user) |> URI.to_string()
            }
          ]
        }
      ]
    })
  end

  def deliver_webhook(:unsuspended,
        user: %User{} = user,
        moderator: %User{} = moderator
      ) do
    webhook(:moderation_actions, %{
      embeds: [
        %{
          author: webhook_author(user),
          title: "User unbanned",
          color: @success_color,
          footer: webhook_author_footer(moderator),
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
        }
      ],
      components: [
        %{
          type: 1,
          components: [
            %{
              type: 2,
              label: "View profile",
              style: 5,
              url: User.url(user) |> URI.to_string()
            }
          ]
        }
      ]
    })
  end

  def deliver_webhook(:indef_shadowbanned,
        user: %User{} = user,
        moderator: %User{} = moderator
      ) do
    webhook(:moderation_actions, %{
      content:
        if(Subscription.active?(user.subscription), do: "<@&458465845887369243>", else: ""),
      embeds: [
        %{
          author: webhook_author(user),
          title: "User indefinitely shadowbanned",
          fields:
            if(Subscription.active?(user.subscription),
              do: [
                %{
                  name: "Active subscription",
                  value:
                    if(user.subscription.chargebee_id,
                      do:
                        "[Cancel subscription](https://flirtual.chargebee.com/d/subscriptions/#{user.subscription.chargebee_id})",
                      else:
                        if(user.subscription.stripe_id,
                          do:
                            "[Cancel subscription](https://dashboard.stripe.com/subscriptions/#{user.subscription.stripe_id})",
                          else:
                            if(user.subscription.google_id,
                              do:
                                "[Get transaction ID](https://app.revenuecat.com/customers/cf0649d1/#{user.revenuecat_id}), [Cancel subscription](https://play.google.com/console/u/0/developers/orders)",
                              else: "Apple subscription - cannot cancel"
                            )
                        )
                    )
                }
              ],
              else: []
            ),
          color: @destructive_color,
          footer: webhook_author_footer(moderator),
          timestamp: DateTime.to_iso8601(user.indef_shadowbanned_at)
        }
      ],
      components: [
        %{
          type: 1,
          components: [
            %{
              type: 2,
              label: "View profile",
              style: 5,
              url: User.url(user) |> URI.to_string()
            }
          ]
        }
      ]
    })
  end

  def deliver_webhook(:unindef_shadowbanned,
        user: %User{} = user,
        moderator: %User{} = moderator
      ) do
    webhook(:moderation_actions, %{
      embeds: [
        %{
          author: webhook_author(user),
          title: "User unshadowbanned",
          color: @success_color,
          footer: webhook_author_footer(moderator),
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
        }
      ]
    })
  end

  def deliver_webhook(:warned,
        user: %User{} = user,
        moderator: %User{} = moderator,
        reason: %Attribute{type: "warn-reason"} = reason,
        message: message,
        shadowbanned: shadowbanned,
        at: warned_at
      ) do
    webhook(:moderation_actions, %{
      embeds: [
        %{
          author: webhook_author(user),
          title: "User warned" <> if(shadowbanned, do: " + shadowbanned", else: ""),
          description: message,
          fields: [
            %{
              name: "Reason",
              value: Map.get(Attribute.warn_reasons(), reason.id),
              inline: true
            }
          ],
          color: @warn_color,
          footer: webhook_author_footer(moderator),
          timestamp: warned_at |> DateTime.to_iso8601()
        }
      ],
      components: [
        %{
          type: 1,
          components: [
            %{
              type: 2,
              label: "View profile",
              style: 5,
              url: User.url(user) |> URI.to_string()
            }
          ]
        }
      ]
    })
  end

  def deliver_webhook(:warn_revoked,
        user: %User{} = user,
        moderator: %User{} = moderator,
        at: warn_revoked_at
      ) do
    webhook(:moderation_actions, %{
      embeds: [
        %{
          author: webhook_author(user),
          title: "Warning revoked",
          color: @success_color,
          footer: webhook_author_footer(moderator),
          timestamp: warn_revoked_at |> DateTime.to_iso8601()
        }
      ]
    })
  end

  def deliver_webhook(:warn_acknowledged,
        user: %User{} = user,
        at: warn_acknowledged_at,
        message: message
      ) do
    webhook(:moderation_acknowledgements, %{
      embeds: [
        %{
          author: webhook_author(user),
          title: "Warning acknowledged",
          description: "Warning: " <> message,
          color: @success_color,
          timestamp: warn_acknowledged_at |> DateTime.to_iso8601()
        }
      ],
      components: [
        %{
          type: 1,
          components: [
            %{
              type: 2,
              label: "View profile",
              style: 5,
              url: User.url(user) |> URI.to_string()
            }
          ]
        }
      ]
    })
  end

  def deliver_webhook(:removed_image,
        user: %User{} = user,
        moderator: %User{} = moderator,
        image: %Image{} = image
      ) do
    webhook(:moderation_pics, %{
      embeds: [
        %{
          author: webhook_author(user),
          title: "Image removed",
          image: %{
            url: image |> Image.url()
          },
          color: @destructive_color,
          footer: webhook_author_footer(moderator),
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
        }
      ]
    })
  end

  def deliver_webhook(:report, %Report{} = report) do
    webhook(:moderation_reports, %{
      embeds: [
        %{
          author: webhook_author(report.target),
          title: "New report",
          fields:
            [
              %{
                name: "Reporter",
                value: md_display_name(report.user),
                inline: true
              },
              %{
                name: "Reason",
                value: Map.get(Attribute.report_reasons(), report.reason.id),
                inline: true
              },
              if(not is_nil(report.target.shadowbanned_at),
                do: %{
                  name: "Shadowbanned ⚠️",
                  value:
                    "This user has received multiple reports, so they've been removed from matchmaking. Please clear reports to unban if appropriate."
                },
                else: nil
              ),
              if(report.message !== "",
                do: %{
                  name: "Message",
                  value: report.message
                },
                else: nil
              ),
              if(report.images !== [],
                do: %{
                  name: "Attachments",
                  value:
                    report.images
                    |> Enum.map(fn image ->
                      "[📎 View file](#{Image.url(:uploads, image)})"
                    end)
                    |> Enum.join("\n")
                },
                else: nil
              )
            ]
            |> Enum.filter(&(!!&1)),
          image:
            if(report.images !== [],
              do: %{
                url:
                  "https://uploads.flirtual.com/#{report.images |> List.first() |> URI.encode()}"
              },
              else: nil
            ),
          color: @default_color,
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
        }
      ],
      components: [
        %{
          type: 1,
          components: [
            %{
              type: 2,
              label: "View profile",
              style: 5,
              url: User.url(report.target) |> URI.to_string()
            }
          ]
        }
      ]
    })
  end

  def deliver_webhook(:review_report,
        report: %Report{} = report,
        moderator: %User{} = moderator,
        was_shadow_banned: was_shadow_banned
      ) do
    webhook(:moderation_reports, %{
      embeds: [
        %{
          author: webhook_author(report.target),
          title: "Report reviewed",
          fields:
            [
              %{
                name: "Moderator",
                value: md_display_name(moderator),
                inline: true
              },
              %{
                name: "Report",
                value: "[View report](https://flirtu.al/reports/#{report.id})",
                inline: true
              },
              if(was_shadow_banned,
                do: %{
                  name: "No longer shadowbanned ✅",
                  value:
                    "This user has been cleared of all reports, and is now back in matchmaking."
                },
                else: nil
              )
            ]
            |> Enum.filter(&(!!&1)),
          color: @success_color,
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
        }
      ]
    })
  end

  def deliver_webhook(:flagged_keyword, user: %User{} = user, flags: flags) do
    webhook(:moderation_flags, %{
      embeds: [
        %{
          author: webhook_author(user),
          title: "Keyword flagged",
          fields: [
            %{
              name: "Flags",
              value: flags
            }
          ],
          color: @warn_color,
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
        }
      ],
      components: [
        %{
          type: 1,
          components: [
            %{
              type: 2,
              label: "View profile",
              style: 5,
              url: User.url(user) |> URI.to_string()
            }
          ]
        }
      ]
    })
  end

  def deliver_webhook(:flagged_bio, user: %User{} = user, flags: flags) do
    webhook(:moderation_flags, %{
      embeds: [
        %{
          author: webhook_author(user),
          title: "Bio content flagged",
          fields: [
            %{
              name: "Flags",
              value: flags
            }
          ],
          color: @default_color,
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
        }
      ],
      components: [
        %{
          type: 1,
          components: [
            %{
              type: 2,
              label: "View profile",
              style: 5,
              url: User.url(user) |> URI.to_string()
            }
          ]
        }
      ]
    })
  end

  def deliver_webhook(:honeypot, user: %User{} = user) do
    webhook(:moderation_flags, %{
      embeds: [
        %{
          author: webhook_author(user),
          title: "Registration honeypot tripped",
          color: @default_color,
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
        }
      ],
      components: [
        %{
          type: 1,
          components: [
            %{
              type: 2,
              label: "View profile",
              style: 5,
              url: User.url(user) |> URI.to_string()
            }
          ]
        }
      ]
    })
  end

  def deliver_webhook(:flagged_duplicate,
        user: %User{} = user,
        duplicates: duplicates,
        type: type,
        text: text
      ) do
    color =
      cond do
        type === "IP address" or
            duplicates == "Banned user" ->
          @warn_color

        type in ["email", "APNS token", "FCM token", "Discord ID", "device ID"] or
            String.ends_with?(type, "(connection updated)") ->
          @destructive_color

        true ->
          @default_color
      end

    webhook(:moderation_duplicates, %{
      embeds: [
        %{
          author: webhook_author(user),
          title: "Potential duplicate",
          fields: [
            %{
              name: "Duplicates",
              value: duplicates
            },
            %{
              name: "Flagged #{type}",
              value: text
            }
          ],
          color: color,
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
        }
      ],
      components: [
        %{
          type: 1,
          components: [
            %{
              type: 2,
              label: "View profile",
              style: 5,
              url: User.url(user) |> URI.to_string()
            }
          ]
        }
      ]
    })
  end

  def deliver_webhook(:flagged_image,
        user: %User{} = user,
        image: %Image{} = image,
        classifications: classifications,
        type: _type
      ) do
    webhook(:moderation_pics, %{
      embeds: [
        %{
          author: webhook_author(user),
          title: "Image auto-flagged",
          image: %{
            url: image |> Image.url()
          },
          fields: [
            %{
              name: "Classifications",
              value:
                classifications["deepDanbooru"]
                |> Map.to_list()
                |> Enum.sort(fn {_, v1}, {_, v2} -> v1 >= v2 end)
                |> Enum.map_join(", ", fn {k, v} ->
                  "``#{k} #{:erlang.float_to_binary(Float.parse(to_string(v)) |> elem(0), decimals: 2)}``"
                end)
            }

            # ,
            # %{
            #   name: "Categories",
            #   value:
            #     classifications["nsfwjs"]
            #     |> Map.to_list()
            #     |> Enum.concat([{to_string(type), 1}])
            #     |> Enum.filter(fn {_, v} -> v >= 0.5 end)
            #     |> Enum.map_join(", ", fn {k, _} -> k end)
            # }
          ],
          color: @default_color,
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
        }
      ],
      components: [
        %{
          type: 1,
          components: [
            %{
              type: 2,
              label: "View profile",
              style: 5,
              url: User.url(user) |> URI.to_string()
            }
          ]
        }
      ]
    })
  end

  def deliver_webhook(:exit_survey,
        user: %User{} = user,
        reason: %Attribute{type: "delete-reason"} = reason,
        comment: comment
      ) do
    webhook(:admin, %{
      embeds: [
        %{
          title: "New exit survey",
          fields:
            [
              %{
                name: "Reason",
                value: reason.id
              },
              if user.preferences.privacy.analytics do
                [
                  %{
                    name: "Age",
                    value: get_years_since(user.born_at),
                    inline: true
                  },
                  %{
                    name: "Genders",
                    value:
                      user.profile.attributes
                      |> filter_by(:type, "gender")
                      |> Enum.map_join(
                        ", \n",
                        &if &1.metadata["simple"] do
                          "**" <> &1.id <> "**"
                        else
                          &1.id
                        end
                      ),
                    inline: true
                  },
                  %{
                    name: "Looking for",
                    value:
                      user.profile.preferences.attributes
                      |> filter_by(:type, "gender")
                      |> Enum.map_join(", \n", & &1.id),
                    inline: true
                  }
                ]
              else
                []
              end,
              %{
                name: "Comment",
                value: comment || "None"
              }
            ]
            |> List.flatten(),
          color: @default_color,
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
        }
      ]
    })
  end
end

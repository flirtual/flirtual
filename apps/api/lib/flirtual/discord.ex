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

  @default_color 255
  @destructive_color 16_711_680
  @warn_color 16_636_429
  @success_color 65_280

  def config(key) do
    Application.get_env(:flirtual, Flirtual.Discord)[key]
  end

  def url(pathname) do
    "https://discord.com/api/" <> pathname
  end

  def webhook_url(name),
    do: url("webhooks/" <> config(String.to_existing_atom("webhook_#{name}")))

  def webhook(name, body) when is_atom(name) do
    log(:debug, [name], body)

    with {:ok, %HTTPoison.Response{status_code: 204}} <-
           HTTPoison.post(
             webhook_url(name),
             Poison.encode!(body),
             [{"content-type", "application/json"}]
           ) do
      :ok
    else
      {:ok, %HTTPoison.Response{} = response} ->
        log(:error, [name], response)
        {:error, :upstream}

      {:error, reason} ->
        {:error, reason}

      reason ->
        reason
    end
  end

  def authorize_url(_, %{state: state, prompt: prompt}) do
    URI.new(
      "https://discord.com/api/oauth2/authorize?" <>
        URI.encode_query(%{
          client_id: config(:client_id),
          redirect_uri: redirect_url!(),
          state: state,
          response_type: "code",
          scope: "identify email",
          prompt: prompt
        })
    )
  end

  def exchange_code(code) when is_binary(code) do
    with {:ok, %HTTPoison.Response{body: body}} <-
           HTTPoison.post(
             url("oauth2/token"),
             URI.encode_query(%{
               client_id: config(:client_id),
               client_secret: config(:client_secret),
               grant_type: "authorization_code",
               redirect_uri: redirect_url!(),
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
      icon_url: User.avatar_thumbnail_url(user)
    }

  def webhook_author_footer(%User{} = user),
    do: %{
      text: md_display_name(user, false),
      icon_url: User.avatar_thumbnail_url(user)
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
                value: reason.name,
                inline: true
              }
            ] ++
              if(Subscription.active?(user.subscription),
                do: [
                  %{
                    name: "Active subscription",
                    value:
                      "[Issue refund](https://dashboard.stripe.com/subscriptions/#{user.subscription.stripe_id})"
                  }
                ],
                else: []
              ),
          color: @destructive_color,
          footer: webhook_author_footer(moderator),
          timestamp: DateTime.to_iso8601(user.banned_at)
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
      ]
    })
  end

  def deliver_webhook(:warned,
        user: %User{} = user,
        moderator: %User{} = moderator,
        message: message,
        at: warned_at
      ) do
    webhook(:moderation_actions, %{
      embeds: [
        %{
          author: webhook_author(user),
          title: "User warned",
          description: message,
          color: @warn_color,
          footer: webhook_author_footer(moderator),
          timestamp: warned_at |> DateTime.to_iso8601()
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
        at: warn_acknowledged_at
      ) do
    webhook(:moderation_actions, %{
      embeds: [
        %{
          author: webhook_author(user),
          title: "Warning acknowledged",
          color: @success_color,
          timestamp: warn_acknowledged_at |> DateTime.to_iso8601()
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
                value: report.reason.name,
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
              )
            ]
            |> Enum.filter(&(!!&1)),
          color: @default_color,
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
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

  def deliver_webhook(:flagged_text, user: %User{} = user, flags: flags) do
    webhook(:moderation_flags, %{
      embeds: [
        %{
          author: webhook_author(user),
          title: "Profile auto-flagged",
          fields: [
            %{
              name: "Flags",
              value: flags
            }
          ],
          color: @default_color,
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
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
    webhook(:moderation_flags, %{
      embeds: [
        %{
          author: webhook_author(user),
          title: "Potential duplicate auto-flagged",
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
          color: @default_color,
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
        }
      ]
    })
  end

  def deliver_webhook(:flagged_image,
        user: %User{} = user,
        image: %Image{} = image,
        classifications: classifications,
        type: type
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
            },
            %{
              name: "Categories",
              value:
                classifications["nsfwjs"]
                |> Map.to_list()
                |> Enum.concat([{to_string(type), 1}])
                |> Enum.filter(fn {_, v} -> v >= 0.5 end)
                |> Enum.map_join(", ", fn {k, _} -> k end)
            }
          ],
          color: @default_color,
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
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
                value: reason.name
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
                          "**" <> &1.name <> "**"
                        else
                          &1.name
                        end
                      ),
                    inline: true
                  },
                  %{
                    name: "Looking for",
                    value:
                      user.profile.preferences.attributes
                      |> filter_by(:type, "gender")
                      |> Enum.map_join(", \n", & &1.name),
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

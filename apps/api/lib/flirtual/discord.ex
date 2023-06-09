defmodule Flirtual.Discord do
  use Flirtual.Logger, :discord
  use Flirtual.Connection.Provider, :discord

  import Flirtual.Utilities

  alias Flirtual.User.Profile.Image
  alias Flirtual.Connection
  alias Flirtual.Report
  alias Flirtual.Attribute
  alias Flirtual.Subscription
  alias Flirtual.{User}

  @default_color 255
  @destructive_color 16_711_680
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
    log(:critical, [name], body)

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

  def authorize_url(_, %{state: state}) do
    URI.new(
      "https://discord.com/api/oauth2/authorize?" <>
        URI.encode_query(%{
          client_id: config(:client_id),
          redirect_uri: redirect_url!(),
          state: state,
          response_type: "code",
          scope: "identify",
          prompt: "none"
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
             url("oauth2/@me"),
             [{"authorization", authorization}]
           ),
         {:ok, body} <- Poison.decode(body),
         %{"user" => profile} <- body,
         %{
           "id" => id,
           "username" => username,
           "discriminator" => discriminator,
           "avatar" => avatar
         } <- profile do
      {:ok,
       %{
         uid: id,
         display_name: "#{username}##{discriminator}",
         avatar: avatar
       }}
    else
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
      icon_url: User.avatar_url(user)
    }

  def deliver_webhook(:suspended,
        user: %User{} = user,
        moderator: %User{} = moderator,
        reason: %Attribute{type: "ban-reason"} = reason,
        message: message
      ) do
    webhook(:moderation, %{
      content:
        if(Subscription.active?(user.subscription), do: "<@&458465845887369243>", else: ""),
      embeds: [
        %{
          author: webhook_author(user),
          title: "User banned",
          fields:
            [
              %{
                name: "Moderator",
                value: md_display_name(moderator),
                inline: true
              },
              %{
                name: "Reason",
                value: reason.name,
                inline: true
              },
              %{
                name: "Message",
                value: message
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
          color: @destructive_color
        }
      ]
    })
  end

  def deliver_webhook(:unsuspended,
        user: %User{} = user,
        moderator: %User{} = moderator
      ) do
    webhook(:moderation, %{
      embeds: [
        %{
          author: webhook_author(user),
          title: "User unsuspended",
          fields: %{
            name: "Moderator",
            value: md_display_name(moderator),
            inline: true
          },
          color: @success_color
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
          fields: [
            %{
              name: "Moderator",
              value: md_display_name(moderator),
              inline: true
            }
          ],
          image: %{
            url: image |> Image.url()
          },
          color: @destructive_color
        }
      ]
    })
  end

  def deliver_webhook(:report, %Report{} = report) do
    webhook(:moderation, %{
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
          color: @default_color
        }
      ]
    })
  end

  def deliver_webhook(:review_report,
        report: %Report{} = report,
        moderator: %User{} = moderator,
        was_shadow_banned: was_shadow_banned
      ) do
    webhook(:moderation, %{
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
          color: @success_color
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
          color: @default_color
        }
      ]
    })
  end

  def deliver_webhook(:flagged_image, user: %User{} = user, image: %Image{} = image) do
    webhook(:moderation_pics, %{
      embeds: [
        %{
          author: webhook_author(user),
          title: "Image auto-flagged",
          image: %{
            url: image |> Image.url()
          },
          color: @default_color
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
                      |> Enum.map(
                        &if &1.metadata["simple"] do
                          "**" <> &1.name <> "**"
                        else
                          &1.name
                        end
                      )
                      |> Enum.join(", \n"),
                    inline: true
                  },
                  %{
                    name: "Looking for",
                    value:
                      user.profile.preferences.attributes
                      |> filter_by(:type, "gender")
                      |> Enum.map(& &1.name)
                      |> Enum.join(", \n"),
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
          color: @default_color
        }
      ]
    })
  end
end

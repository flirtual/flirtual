defmodule Flirtual.Discord do
  use Flirtual.Logger, :discord
  use Flirtual.Connection.Provider, :discord

  import Flirtual.Utilities

  alias Flirtual.Connection
  alias Flirtual.Report
  alias Flirtual.Attribute
  alias Flirtual.Subscription
  alias Flirtual.{User}

  @default_color 15_295_883

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

    HTTPoison.post(
      webhook_url(name),
      Poison.encode!(body),
      [{"content-type", "application/json"}]
    )
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

  def deliver_webhook(:banned,
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
          author: %{
            name: User.display_name(user),
            url: User.url(user),
            icon_url: User.avatar_url(user)
          },
          title: "User banned",
          fields:
            [
              %{
                name: "Moderator",
                value: "[#{User.display_name(moderator)}](#{User.url(moderator)})",
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
          color: @default_color
        }
      ]
    })
  end

  def deliver_webhook(:report, %Report{} = report) do
    webhook(:moderation, %{
      embeds: [
        %{
          author: %{
            name: User.display_name(report.target),
            icon_url: User.avatar_url(report.target),
            url: User.url(report.target)
          },
          title: "New report",
          fields:
            [
              %{
                name: "Reporter",
                value: "[#{User.display_name(report.user)}](#{User.url(report.user)})",
                inline: true
              },
              %{
                name: "Reason",
                value: report.reason.name,
                inline: true
              },
              if(not is_nil(report.target.shadowbanned_at),
                do: %{
                  name: "Shadow banned ⚠️",
                  value:
                    "This user has received multiple reports, so they've been removed from matchmaking. Please clear reports to unban if appropriate."
                },
                else: nil
              ),
              %{
                name: "Details",
                value: report.message
              }
            ]
            |> Enum.filter(&(!!&1)),
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
    webhook(:moderation, %{
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

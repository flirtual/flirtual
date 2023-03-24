defmodule Flirtual.Discord do
  use Flirtual.Logger, :discord

  alias Flirtual.Report
  alias Flirtual.Attribute
  alias Flirtual.Subscription
  alias Flirtual.{User}

  defp config(key) do
    Application.get_env(:flirtual, Flirtual.Discord)[key]
  end

  def url(pathname) do
    "https://discord.com/api/" <> pathname
  end

  def webhook_url(name),
    do: url("webhooks/" <> config(String.to_existing_atom("webhook_#{name}")))

  def webhook(name, body) when is_atom(name) do
    log(:info, [name], body)

    HTTPoison.post(
      webhook_url(name),
      Poison.encode!(body),
      [{"content-type", "application/json"}]
    )
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
          color: 15_295_883
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
          color: 15_295_883
        }
      ]
    })
  end
end

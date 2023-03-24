defmodule Flirtual.Discord do
  use Flirtual.Logger, :discord

  alias Flirtual.{User}

  defp config(key) do
    Application.get_env(:flirtual, Flirtual.Discord)[key]
  end

  def webhook(name, body) when is_atom(name) do
    log(:info, [name], body)

    HTTPoison.post(
      "https://discord.com/api/webhooks/#{config(String.to_existing_atom("webhook_#{name}"))}",
      Poison.encode!(body),
      [{"content-type", "application/json"}]
    )
  end

  def deliver_webhook(:suspended, %User{} = user, %User{} = target_user, message) do
    webhook(:moderation, %{
      content:
        if(is_nil(user.subscription[:cancelled_at]), do: "<@&458465845887369243>", else: ""),
      embeds: [
        %{
          author: %{
            name: target_user.username,
            url: "https://flirtu.al/" <> target_user.username,
            icon_url: User.avatar_url(target_user)
          },
          title: "User banned",
          fields:
            [
              %{
                name: "Moderator",
                value: user.username
              },
              %{
                name: "Reason",
                value: message
              }
            ] ++
              if(is_nil(user.subscription[:cancelled_at]),
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
end

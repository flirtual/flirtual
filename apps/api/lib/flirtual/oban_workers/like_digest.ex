defmodule Flirtual.ObanWorkers.LikeDigest do
  use Oban.Worker, priority: 3, unique: [period: 60 * 60 * 24 * 6, keys: [:user_id]]

  alias Flirtual.{Subscription, User}
  alias Flirtual.User.Profile.LikesAndPasses

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id, "cutoff" => cutoff}}) do
    user = User.get(user_id)

    likes =
      LikesAndPasses.list_unrequited(
        profile_id: user_id,
        since: cutoff
      )

    like_count = likes |> length()

    if like_count !== 0 do
      is_premium = Subscription.active?(user.subscription)

      action_url =
        if(is_premium, do: "https://flirtu.al/likes", else: "https://flirtu.al/browse")

      if user.preferences.email_notifications.likes do
        thumbnails =
          likes
          |> Enum.take(3)
          |> Enum.map(fn user_id ->
            url =
              user_id
              |> User.get()
              |> User.avatar_thumbnail_url()

            if is_premium do
              url
            else
              url <> "/-/blur/35/"
            end
          end)

        %{
          "user_id" => user.id,
          "subject" =>
            if(like_count == 1, do: "Someone ", else: "#{like_count} people ") <>
              "liked your Flirtual profile",
          "action_url" => action_url,
          "body_text" => """
          This week #{if(like_count == 1, do: "1 person", else: "#{like_count} people")} liked or homied your profile on Flirtual!

          #{if(is_premium, do: "See who likes you:", else: "Browse profiles to see if it's a match:")} #{action_url}

          #{if(is_premium, do: "", else: "Or upgrade to Premium to see who likes you right away and never miss another match: https://flirtu.al/subscription")}
          """,
          "body_html" => """
          <p>This week #{if(like_count == 1, do: "1 person", else: "#{like_count} people")} liked or homied your profile on Flirtual!</p>

          #{if(is_premium, do: "<p><a href=\"#{action_url}\">See who likes you</a></p>", else: "<p><a href=\"#{action_url}\">Browse profiles</a> to see if it's a match.</p> <p>Or <a href=\"https://flirtu.al/subscription\">upgrade to Premium</a> to see who likes you right away and never miss another match.</p>")}

          #{Enum.map_join(thumbnails, "", &"<img src=\"#{&1}\" style=\"width: 50px; height: 50px; border-radius: 50%; margin: 0 5px;\" />")}

          <script type="application/ld+json">
          {
            "@context": "http://schema.org",
            "@type": "EmailMessage",
            "description": "#{if(is_premium, do: "See who likes you", else: "Browse profiles")}",
            "potentialAction": {
              "@type": "ViewAction",
              "url": "#{action_url}",
              "name": "View"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Flirtual",
              "url": "https://flirtu.al/"
            }
          }
          </script>
          """
        }
        |> Flirtual.ObanWorkers.Email.new(priority: 2, unique: [period: 60 * 60 * 24 * 6])
        |> Oban.insert()
      end

      if not is_nil(user.apns_token) or not is_nil(user.fcm_token) do
        %{
          "user_id" => user_id,
          "title" =>
            if(like_count == 1,
              do: "Someone liked you!",
              else: "#{like_count} people liked you this week!"
            ),
          "message" =>
            if(is_premium,
              do: "See who likes you and match.",
              else: "Browse profiles to see if it's a match."
            ),
          "url" => action_url
        }
        |> Flirtual.ObanWorkers.Push.new(priority: 2, unique: [period: 60 * 60 * 24 * 6])
        |> Oban.insert()
      end
    end

    :ok
  end
end

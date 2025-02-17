defmodule Flirtual.User.Push do
  alias Flirtual.Subscription
  alias Flirtual.User
  import Flirtual.Gettext

  def deliver(%User{} = user, :daily_profiles_ready, reset_at) do
    language = user.preferences.language || "en"

    Gettext.with_locale(language, fn ->
      %{
        "user_id" => user.id,
        # "title" => "Your daily profiles are ready!",
        "title" => dgettext("notifications", "daily_profiles_ready"),
        # "We've worked our matchmaking magic on a fresh batch of profiles just for you. Tap to check them out!",
        "message" => dgettext("notifications", "daily_profiles_ready_message"),
        "url" => "flirtual://browse"
      }
      |> Flirtual.ObanWorkers.Push.new(
        scheduled_at: DateTime.add(reset_at, 6 * 60 * 60),
        unique: [timestamp: :scheduled_at]
      )
      |> Oban.insert()
    end)
  end

  def deliver(%User{} = user, :new_match, options) do
    language = user.preferences.language || "en"

    Gettext.with_locale(language, fn ->
      conversation_id = Keyword.fetch!(options, :conversation_id)
      match_kind = Keyword.fetch!(options, :match_kind)

      target_user = Keyword.fetch!(options, :target_user)
      target_display_name = User.display_name(target_user)

      %{
        "user_id" => user.id,
        "title" =>
          if(match_kind == :love,
            do: dgettext("notifications", "its_a_match"),
            else: dgettext("notifications", "its_a_match_homie")
          ),
        "message" =>
          if(match_kind == :love,
            do: dgettext("notifications", "liked_you", name: target_display_name),
            else: dgettext("notifications", "homied_you", name: target_display_name)
          ),
        "url" => "flirtual://matches/" <> conversation_id,
        "match_notification" => true
      }
      |> Flirtual.ObanWorkers.Push.new(
        unique: [period: 60 * 60, states: [:available, :scheduled, :executing, :completed]]
      )
      |> Oban.insert()
    end)
  end

  def deliver(%User{} = user, :like_digest, options) do
    language = user.preferences.language || "en"

    Gettext.with_locale(language, fn ->
      like_count = Keyword.fetch!(options, :like_count)
      is_premium? = Subscription.active?(user.subscription)

      %{
        "user_id" => user.id,
        "title" =>
          dngettext("notifications", "someone_liked_you", "x_people_liked_you", like_count, %{
            count: like_count
          }),
        "message" =>
          if(is_premium?,
            # do: "See who likes you and match.",
            do: dgettext("notifications", "see_who_likes_you_and_match"),
            # else: "Browse profiles to see if it's a match."
            else: dgettext("notifications", "browse_profiles_to_see_if_its_a_match")
          ),
        "url" => if(is_premium?, do: "flirtual://likes", else: "flirtual://browse")
      }
      |> Flirtual.ObanWorkers.Push.new(priority: 2, unique: [period: 60 * 60 * 24 * 6])
      |> Oban.insert()
    end)
  end
end

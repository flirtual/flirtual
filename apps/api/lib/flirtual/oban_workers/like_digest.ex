defmodule Flirtual.ObanWorkers.LikeDigest do
  @six_days 60 * 60 * 24 * 6
  use Oban.Worker, priority: 3, unique: [period: @six_days, keys: [:user_id]]

  alias Flirtual.User
  alias Flirtual.User.Profile.LikesAndPasses

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id, "cutoff" => cutoff}}) do
    user = User.get(user_id)

    likes =
      LikesAndPasses.list_unrequited(
        profile_id: user_id,
        since: cutoff
      )

    like_count = length(likes)

    if like_count !== 0 and is_nil(user.banned_at) and is_nil(user.deactivated_at) do
      if user.preferences.email_notifications.likes do
        User.Email.deliver(user, :like_digest, likes: likes)
      end

      if user.preferences.push_notifications.likes and
           (not is_nil(user.apns_token) or not is_nil(user.fcm_token)) do
        User.Push.deliver(user, :like_digest, like_count: like_count)
      end
    end

    :ok
  end
end

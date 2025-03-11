defmodule Flirtual.ObanWorkers.Push do
  use Oban.Worker, priority: 1, unique: [period: :infinity, states: [:available, :scheduled]]

  alias Flirtual.{PushNotification, User}

  @impl Oban.Worker
  def perform(%Oban.Job{
        args:
          %{
            "user_id" => user_id,
            "title" => title,
            "message" => message,
            "url" => url
          } = args,
        scheduled_at: scheduled_at
      }) do
    user = User.get(user_id)

    is_daily_profiles_ready_notification? =
      Map.get(args, "daily_profiles_ready_notification", false)

    if is_nil(user.banned_at) and is_nil(user.deactivated_at) and
         (!is_daily_profiles_ready_notification? or
            DateTime.before?(user.active_at, DateTime.add(scheduled_at, -7 * 60 * 60))) do
      PushNotification.send(user, title, message, url)
    else
      :ok
    end
  end
end

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
    case User.get(user_id) do
      nil ->
        {:cancel, "deleted"}

      %User{banned_at: banned} when not is_nil(banned) ->
        {:cancel, "banned"}

      %User{deactivated_at: deactivated} when not is_nil(deactivated) ->
        {:cancel, "deactivated"}

      %User{} = user ->
        is_daily_profiles_ready_notification? =
          Map.get(args, "daily_profiles_ready_notification", false)

        if is_daily_profiles_ready_notification? and
             DateTime.after?(user.active_at, DateTime.add(scheduled_at, -7 * 60 * 60)) do
          {:cancel, "seen"}
        else
          PushNotification.send(user, title, message, url)
        end
    end
  end
end

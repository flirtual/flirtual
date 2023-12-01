defmodule Flirtual.ObanWorkers.Push do
  use Oban.Worker, priority: 1, unique: [period: :infinity, states: [:available, :scheduled]]

  alias Flirtual.{PushNotification, User}

  @impl Oban.Worker
  def perform(%Oban.Job{
        args: %{
          "user_id" => user_id,
          "title" => title,
          "message" => message,
          "url" => url
        }
      }) do
    user = User.get(user_id)

    PushNotification.send(user, title, message, url)
  end
end

defmodule Flirtual.ObanWorkers.PruneAccount do
  use Oban.Worker, priority: 3, unique: [period: 60 * 60 * 20]

  alias Flirtual.{User, Users}

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id}}) do
    User.get(user_id)
    |> Users.admin_delete()
  end
end

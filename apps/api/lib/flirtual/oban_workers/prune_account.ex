defmodule Flirtual.ObanWorkers.PruneAccount do
  use Oban.Worker, priority: 1, unique: [period: 60 * 60 * 20]

  alias Flirtual.{User, Users}

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id}}) do
    case User.get(user_id) do
      %User{} = user -> Users.admin_delete(user)
      nil -> :ok
    end
  end
end

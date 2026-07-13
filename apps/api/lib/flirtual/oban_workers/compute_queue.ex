defmodule Flirtual.ObanWorkers.ComputeQueue do
  use Oban.Worker,
    queue: :matchmaking,
    unique: [
      period: 60,
      states: [:available, :scheduled, :executing],
      keys: [:user_id, :kind]
    ]

  import Ecto.Query

  alias Flirtual.{Matchmaking, Repo, User}

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id, "kind" => kind}}) do
    case load_user(user_id) do
      nil -> :ok
      user -> Matchmaking.compute_queue(user, String.to_existing_atom(kind))
    end
  end

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_ids" => user_ids}}) do
    user_ids
    |> Enum.each(fn user_id ->
      case load_user(user_id) do
        nil ->
          :ok

        user ->
          :ok = Matchmaking.compute_queue(user, :love)
          :ok = Matchmaking.compute_queue(user, :friend)
      end
    end)
  end

  defp load_user(user_id) do
    User
    |> where(id: ^user_id)
    |> preload(^User.default_assoc())
    |> Repo.one()
  end
end

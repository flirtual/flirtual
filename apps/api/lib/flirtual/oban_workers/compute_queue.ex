defmodule Flirtual.ObanWorkers.ComputeQueue do
  use Oban.Worker,
    queue: :matchmaking,
    unique: [
      period: 60,
      states: :incomplete,
      keys: [:user_id, :kind]
    ]

  import Ecto.Query

  alias Flirtual.{Matchmaking, Repo, User}
  alias Flirtual.User.Profile.Queue

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id, "kind" => kind}}) do
    kind = String.to_existing_atom(kind)

    cond do
      not Queue.kind?(kind) -> :ok
      user = load_user(user_id) -> Matchmaking.compute_queue(user, kind)
      true -> :ok
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
          Enum.each(Queue.kinds(), &Matchmaking.compute_queue(user, &1))
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

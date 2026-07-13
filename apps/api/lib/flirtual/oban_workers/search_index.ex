defmodule Flirtual.ObanWorkers.SearchIndex do
  use Oban.Worker, unique: [period: :infinity, states: [:available, :scheduled]]

  import Ecto.Query

  alias Flirtual.{Repo, Search, User}
  alias Flirtual.User.Profile.Prospect

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"reindex" => true}}) do
    Search.reindex_all()
  end

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id}}) do
    process_users([user_id])
  end

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_ids" => user_ids}}) do
    process_users(user_ids)
  end

  def process_users(user_ids) do
    users =
      User
      |> where([user], user.id in ^user_ids)
      |> preload(^User.default_assoc())
      |> Repo.all()

    {visible, hidden} = Enum.split_with(users, &(&1.status == :visible))

    Enum.each(hidden, fn user ->
      {:ok, _} = Prospect.delete_all(target_id: user.id)
    end)

    with :ok <- index(visible),
         :ok <- delete(hidden) do
      :ok
    end
  end

  defp index([]), do: :ok
  defp index(users), do: Search.index_users(users)

  defp delete([]), do: :ok
  defp delete(users), do: Search.delete_users(Enum.map(users, & &1.id))
end

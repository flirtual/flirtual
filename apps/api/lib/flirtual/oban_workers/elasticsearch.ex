defmodule Flirtual.ObanWorkers.Elasticsearch do
  use Oban.Worker, unique: [period: :infinity, states: [:available, :scheduled]]

  import Ecto.Query

  alias Flirtual.{Elasticsearch, Repo, User}
  alias Flirtual.User.Profile.Prospect
  alias Flirtual.User.SearchDocument
  alias Snap.Bulk.Action

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

    users
    |> Enum.each(fn user ->
      if user.status != :visible do
        Prospect
        |> where([prospect], prospect.target_id == ^user.id)
        |> Repo.delete_all()
      end
    end)

    users
    |> Enum.map(fn user ->
      if user.status == :visible do
        %Action.Index{id: user.id, doc: SearchDocument.encode(user)}
      else
        %Action.Delete{id: user.id}
      end
    end)
    |> Snap.Bulk.perform(Elasticsearch, "users", page_wait: 0)
  end
end

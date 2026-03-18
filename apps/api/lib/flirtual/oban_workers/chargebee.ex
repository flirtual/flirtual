defmodule Flirtual.ObanWorkers.Chargebee do
  use Oban.Worker, unique: [period: :infinity, states: [:available, :scheduled]]

  import Ecto.Query

  alias Flirtual.{Chargebee, Repo, User}

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id}}) do
    process_users([user_id])
  end

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_ids" => user_ids}}) do
    process_users(user_ids)
  end

  def process_users(user_ids) do
    User
    |> where([user], user.id in ^user_ids)
    |> preload(^User.default_assoc())
    |> Repo.all()
    |> Enum.each(&Chargebee.update_customer/1)
  end
end

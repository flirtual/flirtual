defmodule Flirtual.ObanWorkers.Chargebee do
  use Oban.Worker, unique: [period: :infinity, states: [:available, :scheduled]]

  alias Flirtual.{Chargebee, User}

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id}}) do
    process_users([user_id])
  end

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_ids" => user_ids}}) do
    process_users(user_ids)
  end

  def process_users(user_ids) do
    user_ids
    |> Enum.map(&User.get/1)
    |> Enum.each(&Chargebee.update_customer/1)
  end
end

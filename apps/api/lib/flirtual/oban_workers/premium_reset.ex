defmodule Flirtual.ObanWorkers.PremiumReset do
  use Oban.Worker

  alias Flirtual.{Matchmaking, Subscription, User}

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
    |> Enum.filter(&Subscription.active?(&1.subscription))
    |> Enum.each(&Matchmaking.reset_prospects/1)
  end
end

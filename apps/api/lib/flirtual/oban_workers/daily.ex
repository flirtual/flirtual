defmodule Flirtual.ObanWorkers.Daily do
  use Oban.Worker, unique: [period: 60 * 60 * 20]

  import Ecto.Query

  alias Flirtual.{Repo, User}

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    enabled_cron_tasks = Application.get_env(:flirtual, Flirtual.ObanWorkers)[:enabled_cron_tasks]

    if Enum.member?(enabled_cron_tasks, :prune_banned) do
      cutoff = DateTime.utc_now() |> DateTime.add(-30, :day)

      User
      |> where(
        [user],
        not is_nil(user.banned_at) and
          user.banned_at < ^cutoff
      )
      |> Repo.all()
      |> Enum.each(fn user ->
        %{
          "user_id" => user.id
        }
        |> Flirtual.ObanWorkers.PruneBanned.new()
        |> Oban.insert()
      end)
    end

    :ok
  end
end

defmodule Flirtual.ObanWorkers.Daily do
  use Oban.Worker, unique: [period: 60 * 60 * 20]

  import Ecto.Query

  alias Flirtual.{Repo, User}
  alias Flirtual.User.Session

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

    if Enum.member?(enabled_cron_tasks, :prune_sessions) do
      now = DateTime.utc_now()
      absolute_expire_at = DateTime.add(now, -Session.max_age(:absolute), :second)

      Session
      |> where(
        [session],
        session.expire_at <= ^now or session.created_at <= ^absolute_expire_at
      )
      |> Repo.delete_all()
    end

    :ok
  end
end

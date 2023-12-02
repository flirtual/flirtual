defmodule Flirtual.ObanWorkers.Weekly do
  use Oban.Worker, unique: [period: 60 * 60 * 24 * 6]

  import Ecto.Query

  alias Flirtual.{Repo, User}
  alias Flirtual.User.Profile.{Block, LikesAndPasses}

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    enabled_cron_tasks = Application.get_env(:flirtual, Flirtual.ObanWorkers)[:enabled_cron_tasks]

    if Enum.member?(enabled_cron_tasks, :like_digest) do
      cutoff = DateTime.utc_now() |> DateTime.add(-7, :day)

      subquery =
        from(lap in LikesAndPasses,
          where:
            lap.type == :like and
              lap.created_at >= ^cutoff,
          join: user in User,
          on: user.id == lap.target_id,
          left_join: opposite in LikesAndPasses,
          on:
            lap.profile_id == opposite.target_id and
              lap.target_id == opposite.profile_id and
              opposite.type == :like,
          left_join: block in Block,
          on:
            lap.profile_id == block.target_id and
              lap.target_id == block.profile_id,
          where:
            is_nil(opposite) and
              is_nil(block) and
              user.visible,
          select: lap.target_id
        )

      query =
        from(user in User,
          join: prefs in assoc(user, :preferences),
          join: email_notif in assoc(prefs, :email_notifications),
          join: push_notif in assoc(prefs, :push_notifications),
          join: unrequited in subquery(subquery),
          on: unrequited.target_id == user.id,
          where:
            not is_nil(user.email_confirmed_at) and
              is_nil(user.banned_at) and
              is_nil(user.deactivated_at) and
              (email_notif.likes == true or
                 (push_notif.likes == true and
                    (not is_nil(user.apns_token) or
                       not is_nil(user.fcm_token)))),
          select: user.id,
          distinct: true
        )

      query
      |> Repo.all()
      |> Enum.each(fn user_id ->
        %{
          "user_id" => user_id,
          "cutoff" => cutoff
        }
        |> Flirtual.ObanWorkers.LikeDigest.new()
        |> Oban.insert()
      end)
    end

    :ok
  end
end

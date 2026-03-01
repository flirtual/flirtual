defmodule Flirtual.ObanWorkers.Daily do
  use Oban.Worker, unique: [period: 60 * 60 * 20]

  import Ecto.Query

  alias Flirtual.{Repo, User}
  alias Flirtual.User.{Email, Login, Push, Session}
  alias Flirtual.User.Profile.Attributes

  # Delay deletion for users 670+ days inactive when pruning introduced
  @grace_period_cutoff ~U[2024-02-16 00:00:00Z]
  @grace_period_deletion_date ~D[2026-02-16]

  @reminders [
    {670, :reminder_670},
    {700, :reminder_700},
    {723, :reminder_723}
  ]

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    enabled = Application.get_env(:flirtual, Flirtual.ObanWorkers)[:enabled_cron_tasks]

    if :prune_banned in enabled, do: prune_banned()
    if :prune_inactive in enabled, do: prune_inactive()
    if :prune_sessions in enabled, do: prune_sessions()
    if :update_attribute_order in enabled, do: update_attribute_order()

    :ok
  end

  defp prune_banned do
    cutoff = DateTime.add(DateTime.utc_now(), -30, :day)

    User
    |> where(
      [user],
      not is_nil(user.banned_at) and user.banned_at < ^cutoff
    )
    |> select([user], user.id)
    |> Repo.all()
    |> Enum.each(&queue_deletion/1)
  end

  defp prune_inactive do
    now = DateTime.utc_now()
    today = Date.utc_today()

    # Reminders 60, 30, 7 days before deletion
    for {days, tag} <- Enum.reverse(@reminders) do
      tags_gte =
        User.reminder_tags()
        |> Enum.drop_while(&(&1 != tag))
        |> Enum.map(&to_string/1)

      user_ids =
        from(user in User,
          where: user.active_at <= ^DateTime.add(now, -days, :day),
          where: user.active_at > ^DateTime.add(now, -730, :day),
          where: user.active_at >= ^@grace_period_cutoff,
          where: is_nil(user.banned_at),
          where: not is_nil(user.email_confirmed_at),
          where: not fragment("? && ?::citext[]", user.tags, ^tags_gte),
          select: user.id
        )
        |> Repo.all()

      if user_ids != [] do
        tag_str = to_string(tag)

        from(user in User,
          where: user.id in ^user_ids,
          update: [
            set: [
              tags:
                fragment(
                  "array_append(array_remove(array_remove(array_remove(?, ?), ?), ?), ?)",
                  user.tags,
                  "reminder_670",
                  "reminder_700",
                  "reminder_723",
                  ^tag_str
                )
            ]
          ]
        )
        |> Repo.update_all([])

        Enum.each(user_ids, &queue_reminder(&1, days))
      end
    end

    # Grace period reminders
    days_until = Date.diff(@grace_period_deletion_date, today)

    if days_until > 0 do
      for {days, tag} <- Enum.reverse(@reminders),
          days_until <= 730 - days do
        tags_gte =
          User.reminder_tags()
          |> Enum.drop_while(&(&1 != tag))
          |> Enum.map(&to_string/1)

        user_ids =
          from(user in User,
            where: user.active_at < ^@grace_period_cutoff,
            where: is_nil(user.banned_at),
            where: not is_nil(user.email_confirmed_at),
            where: not fragment("? && ?::citext[]", user.tags, ^tags_gte),
            select: user.id
          )
          |> Repo.all()

        if user_ids != [] do
          tag_str = to_string(tag)

          from(user in User,
            where: user.id in ^user_ids,
            update: [
              set: [
                tags:
                  fragment(
                    "array_append(array_remove(array_remove(array_remove(?, ?), ?), ?), ?)",
                    user.tags,
                    "reminder_670",
                    "reminder_700",
                    "reminder_723",
                    ^tag_str
                  )
              ]
            ]
          )
          |> Repo.update_all([])

          Enum.each(user_ids, &queue_reminder(&1, days))
        end
      end
    end

    # Account deletion at 730 days inactive (after grace period)
    if Date.compare(today, @grace_period_deletion_date) != :lt do
      deletion_cutoff = DateTime.add(now, -730, :day)

      from(user in User,
        where: is_nil(user.banned_at),
        where: user.active_at <= ^deletion_cutoff,
        select: user.id
      )
      |> Repo.all()
      |> Enum.each(&queue_deletion/1)
    end
  end

  defp prune_sessions do
    now = DateTime.utc_now()
    absolute_expire_at = DateTime.add(now, -Session.max_age(:absolute), :second)
    login_prune_at = DateTime.add(now, -30, :day)

    Session
    |> where(
      [session],
      session.expire_at <= ^now or session.created_at <= ^absolute_expire_at
    )
    |> Repo.delete_all()

    Login
    |> where(
      [login],
      is_nil(login.session_id) and login.created_at <= ^login_prune_at
    )
    |> Repo.delete_all()
  end

  defp queue_reminder(user_id, days) do
    if user = User.get(user_id) do
      Email.deliver(user, :deletion_reminder, days: days)
      Push.deliver(user, :deletion_reminder, days: days)
    end
  end

  defp queue_deletion(user_id) do
    %{"user_id" => user_id}
    |> Flirtual.ObanWorkers.PruneAccount.new()
    |> Oban.insert()
  end

  defp update_attribute_order do
    Attributes.update_order("game",
      order_by: :trending,
      recent_days: 90,
      recent_boost: 10,
      release_days: 180,
      release_boost: 0.01
    )
  end
end

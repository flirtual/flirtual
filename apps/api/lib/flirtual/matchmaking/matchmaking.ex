defmodule Flirtual.Matchmaking do
  use Flirtual.Logger, :matchmaking

  import Ecto.Query

  alias Flirtual.Conversation
  alias Flirtual.Matchmaking.Query
  alias Flirtual.ObanWorkers
  alias Flirtual.Repo
  alias Flirtual.Search
  alias Flirtual.Subscription
  alias Flirtual.Talkjs
  alias Flirtual.User
  alias Flirtual.User.Profile.Block
  alias Flirtual.User.Profile.LikesAndPasses
  alias Flirtual.User.Profile.Prospect
  alias Flirtual.User.Profile.Queue

  # Free users, per mode, per day.
  @daily_likes_limit 15
  @daily_browses_limit 30

  # Users with an incomplete profile or unconfirmed email.
  @trial_likes_limit 7
  @trial_browses_limit 15

  # Uncompleted prospects loaded per read and protected across recomputes.
  @foresight 3

  # Uncompleted prospects exposed through the API.
  @visible_prospects 2

  # Recompute is queued once this number of uncompleted prospects remain.
  @refresh_threshold 5

  def next_reset_at do
    now = DateTime.utc_now()
    today_9am = DateTime.new!(Date.utc_today(), Time.new!(9, 0, 0, 0))

    case DateTime.compare(now, today_9am) do
      :lt -> today_9am
      _ -> DateTime.add(today_9am, 24 * 60 * 60)
    end
    |> DateTime.truncate(:second)
  end

  def reduce_kind(a, b) when a === :friend or b === :friend, do: :friend
  def reduce_kind(_, _), do: :love

  defp trial_user?(%User{} = user) do
    user.status in [:registered, :onboarded] || is_nil(user.email_confirmed_at)
  end

  defp trial_exhausted?(%User{} = user) do
    user.likes_count + user.passes_count >= @trial_browses_limit ||
      user.likes_count >= @trial_likes_limit
  end

  defp trial_error(%User{status: :finished_profile}), do: :confirm_email
  defp trial_error(_), do: :finish_profile

  def queue_information(%User{} = user, kind) do
    if trial_user?(user) and trial_exhausted?(user) do
      {:error, {:forbidden, trial_error(user)}}
    else
      queue = Queue.get(user.id, kind)
      uncompleted = Prospect.list_uncompleted(user.id, kind, @foresight)
      remaining = Prospect.count_uncompleted(user.id, kind)
      previous = Prospect.last_completed(user.id, kind)

      enqueued = maybe_enqueue_compute(user.id, kind, queue, remaining)

      {:ok,
       %{
         previous: previous && previous.target_id,
         next: uncompleted |> Enum.take(@visible_prospects) |> Enum.map(& &1.target_id),
         fallback: fallback_head?(uncompleted),
         notice: fallback_notice(queue, uncompleted),
         limits: limits(user, queue),
         can_undo: not queue.undone and not is_nil(previous),
         pending: remaining == 0 and (enqueued == :enqueued or pending?(queue))
       }}
    end
  end

  defp fallback_head?([%Prospect{fallback: fallback} | _]), do: fallback
  defp fallback_head?(_), do: false

  defp pending?(%Queue{requested_at: nil}), do: false
  defp pending?(%Queue{computed_at: nil}), do: true

  defp pending?(%Queue{requested_at: requested_at, computed_at: computed_at}),
    do: DateTime.compare(requested_at, computed_at) == :gt

  defp fallback_notice(%Queue{} = queue, uncompleted) do
    with [%Prospect{fallback: true} = head | _] <- uncompleted,
         true <- notice_armed?(queue),
         true <- computed_since_filter_change?(head, queue) do
      "fallback"
    else
      _ -> nil
    end
  end

  defp notice_armed?(%Queue{fallback_notified_at: nil}), do: true

  defp notice_armed?(%Queue{fallback_notified_at: notified_at, filters_updated_at: updated_at}),
    do: not is_nil(updated_at) and DateTime.compare(notified_at, updated_at) == :lt

  defp computed_since_filter_change?(_head, %Queue{filters_updated_at: nil}), do: true

  defp computed_since_filter_change?(%Prospect{created_at: created_at}, %Queue{
         filters_updated_at: updated_at
       }),
       do: DateTime.compare(created_at, updated_at) != :lt

  def dismiss_fallback_notice(user_id, kind) do
    {:ok, _} =
      Queue.upsert(user_id, kind, %{
        fallback_notified_at: DateTime.utc_now() |> DateTime.truncate(:second)
      })

    :ok
  end

  # Blocking a prospect counts towards the daily free pass limit.
  def record_block_passes(%User{} = user, kinds) when is_list(kinds) do
    Enum.each(kinds, fn kind ->
      _ = ensure_fresh_queue(Queue.get(user.id, kind))
      {:ok, _} = Queue.increment(user.id, kind, :passes_count)
    end)

    if kinds != [] do
      {_, nil} =
        User
        |> where(id: ^user.id)
        |> Repo.update_all(inc: [passes_count: 1])
    end

    :ok
  end

  def limits(%User{} = user, %Queue{} = queue) do
    cond do
      Subscription.active?(user.subscription) ->
        nil

      trial_user?(user) ->
        %{
          likes: %{used: user.likes_count, max: @trial_likes_limit},
          browses: %{used: user.likes_count + user.passes_count, max: @trial_browses_limit},
          reset_at: nil
        }

      true ->
        {likes, passes} = effective_counts(queue)

        %{
          likes: %{used: likes, max: @daily_likes_limit},
          browses: %{used: likes + passes, max: @daily_browses_limit},
          reset_at: next_reset_at()
        }
    end
  end

  # Counters as of now, without persisting a lazy reset on read.
  defp effective_counts(%Queue{} = queue) do
    if reset_stale?(queue), do: {0, 0}, else: {queue.likes_count, queue.passes_count}
  end

  defp reset_stale?(%Queue{reset_at: nil}), do: true

  defp reset_stale?(%Queue{reset_at: reset_at}),
    do: DateTime.compare(reset_at, DateTime.utc_now()) == :lt

  # Stale counters are zeroed lazily, whenever they're about to change.
  defp ensure_fresh_queue(%Queue{} = queue) do
    if reset_stale?(queue) do
      reset_at = next_reset_at()

      {:ok, _} =
        Queue.upsert(queue.profile_id, queue.kind, %{
          likes_count: 0,
          passes_count: 0,
          reset_at: reset_at
        })

      %{queue | likes_count: 0, passes_count: 0, reset_at: reset_at}
    else
      queue
    end
  end

  defp maybe_enqueue_compute(user_id, kind, %Queue{} = queue, remaining) do
    cond do
      pending?(queue) ->
        :pending

      # Drained and nothing has changed; don't re-search on every read.
      exhausted?(queue) ->
        :ok

      remaining <= @refresh_threshold ->
        enqueue_compute(user_id, kind)
        :enqueued

      # While in fallback mode, search for non-fallback profiles after the daily reset time.
      queue.fallback_active and computed_before_reset?(queue) ->
        enqueue_compute(user_id, kind)
        :enqueued

      true ->
        :ok
    end
  end

  # A drained queue re-arms on a filter change or after the daily reset.
  defp exhausted?(%Queue{exhausted_at: nil}), do: false

  defp exhausted?(%Queue{exhausted_at: exhausted_at, filters_updated_at: filters_updated_at}) do
    filters_unchanged =
      is_nil(filters_updated_at) or DateTime.compare(filters_updated_at, exhausted_at) != :gt

    same_reset_window = DateTime.compare(exhausted_at, last_reset_at()) != :lt

    filters_unchanged and same_reset_window
  end

  defp last_reset_at, do: DateTime.add(next_reset_at(), -24 * 60 * 60)

  defp computed_before_reset?(%Queue{computed_at: nil}), do: true

  defp computed_before_reset?(%Queue{computed_at: computed_at}),
    do: DateTime.compare(computed_at, last_reset_at()) == :lt

  def enqueue_compute(user_id, kind) do
    {:ok, _} = Queue.upsert(user_id, kind, %{requested_at: DateTime.utc_now()})

    {:ok, _} =
      %{user_id: user_id, kind: kind}
      |> ObanWorkers.ComputeQueue.new()
      |> Oban.insert()

    :ok
  end

  # When matchmaking settings are updated, prune each queue to the current
  # and previous profile, then recompute everything after them.
  def refresh_queues(user_id, opts \\ []) do
    if Keyword.get(opts, :filters_updated, false), do: Queue.touch_filters_updated(user_id)

    Enum.each(Queue.kinds(), fn kind ->
      protected_ids =
        [
          Prospect.list_uncompleted(user_id, kind, 1),
          Prospect.last_completed(user_id, kind)
        ]
        |> List.flatten()
        |> Enum.reject(&is_nil/1)
        |> Enum.map(& &1.id)

      Prospect
      |> where([p], p.profile_id == ^user_id and p.kind == ^kind and p.id not in ^protected_ids)
      |> Repo.delete_all()

      enqueue_compute(user_id, kind)
    end)

    :ok
  end

  def compute_queue(%User{} = user, kind) do
    # Pickiness is updated at the same time as a recompute.
    Search.update_like_multiplier(user.id)

    queue = Queue.get(user.id, kind)
    filters_snapshot = queue.filters_updated_at

    uncompleted = Prospect.list_uncompleted(user.id, kind, @foresight)
    last = Prospect.last_completed(user.id, kind)

    protected = Enum.uniq_by(uncompleted ++ List.wrap(last), & &1.target_id)
    protected_ids = Enum.map(protected, & &1.target_id)

    with {:ok, primary} <- search_prospects(user, kind, protected_ids, false),
         {:ok, fallback} <-
           maybe_search_fallback(user, kind, protected_ids, primary) do
      write_queue(user, kind, protected, primary, fallback, filters_snapshot)
    end
  end

  defp search_prospects(user, kind, exclude_ids, fallback?, size \\ nil) do
    query =
      Query.build(user, kind,
        fallback: fallback?,
        exclude_ids: exclude_ids,
        size: size || Query.default_size()
      )

    with {:ok, hits} <- Search.search(query) do
      {:ok, verify_visible(hits)}
    end
  end

  # No fallback for Homie Mode; an incomplete primary result means the pool is simply exhausted.
  defp maybe_search_fallback(_user, :friend, _exclude_ids, _primary), do: {:ok, []}

  defp maybe_search_fallback(user, kind, exclude_ids, primary) do
    missing = Query.default_size() - length(primary)

    if missing > 0 do
      search_prospects(
        user,
        kind,
        exclude_ids ++ Enum.map(primary, & &1.user_id),
        true,
        missing
      )
    else
      {:ok, []}
    end
  end

  # The search index may lag Postgres; never serve prospects that aren't
  # currently visible.
  defp verify_visible(hits) do
    ids = Enum.map(hits, & &1.user_id)

    visible =
      User
      |> where([u], u.id in ^ids and u.status == :visible)
      |> select([u], u.id)
      |> Repo.all()
      |> MapSet.new()

    Enum.filter(hits, &MapSet.member?(visible, &1.user_id))
  end

  defp write_queue(user, kind, protected, primary, fallback, filters_snapshot) do
    protected_row_ids = Enum.map(protected, & &1.id)

    base_position =
      protected
      |> Enum.filter(&is_nil(&1.completed_at))
      |> Enum.map(& &1.position)
      |> Enum.max(&>=/2, fn -> -1 end)

    rows =
      (Enum.map(primary, &{&1, false}) ++ Enum.map(fallback, &{&1, true}))
      |> Enum.with_index(base_position + 1)
      |> Enum.map(fn {{hit, fallback?}, position} ->
        %{
          profile_id: user.id,
          target_id: hit.user_id,
          kind: kind,
          position: position,
          score: hit.score * 1.0,
          fallback: fallback?
        }
      end)

    result =
      Repo.transaction(fn ->
        current = Queue.get(user.id, kind)

        if current.filters_updated_at != filters_snapshot do
          Repo.rollback(:stale_filters)
        end

        Prospect
        |> where(
          [p],
          p.profile_id == ^user.id and p.kind == ^kind and p.id not in ^protected_row_ids
        )
        |> Repo.delete_all()

        {:ok, _} = Prospect.insert_all(rows)

        fallback_active = fallback != [] or Enum.any?(protected, & &1.fallback)

        {:ok, _} =
          %{
            computed_at: DateTime.utc_now(),
            fallback_active: fallback_active,
            # No new prospects: the pool is drained.
            exhausted_at: if(rows == [], do: DateTime.utc_now() |> DateTime.truncate(:second))
          }
          |> then(&Queue.upsert(user.id, kind, &1))

        length(rows)
      end)

    case result do
      {:ok, count} ->
        log(:debug, ["computed", user.id, kind], %{count: count, fallback: length(fallback)})
        :ok

      {:error, :stale_filters} ->
        enqueue_compute(user.id, kind)
        :ok

      {:error, reason} ->
        {:error, reason}
    end
  end

  def respond(opts \\ []) do
    user = Keyword.fetch!(opts, :user)
    type = Keyword.fetch!(opts, :type)
    mode = Keyword.get(opts, :mode, :love)

    target = Keyword.get(opts, :target) || User.get(Keyword.get(opts, :target_id))

    with {:ok, target} <- validate_target(user, target),
         queue = ensure_fresh_queue(Queue.get(user.id, mode)),
         :ok <- check_limits(user, queue, type),
         {:ok, result} <- insert_response(user, target, type, mode) do
      after_respond(user, target, result, mode)
      {:ok, result}
    end
  end

  defp validate_target(_user, nil), do: {:error, {:not_found, :user_not_found}}

  defp validate_target(%User{id: id}, %User{id: id}),
    do: {:error, {:bad_request, :cannot_like_self}}

  defp validate_target(%User{} = user, %User{} = target) do
    if Block.exists?(user_id: user.id, target_id: target.id) or
         Block.exists?(user_id: target.id, target_id: user.id) do
      {:error, {:forbidden, :blocked}}
    else
      {:ok, target}
    end
  end

  defp check_limits(%User{} = user, %Queue{} = queue, type) do
    cond do
      Subscription.active?(user.subscription) ->
        :ok

      trial_user?(user) ->
        if trial_exhausted?(user) or
             (type == :like and user.likes_count >= @trial_likes_limit) do
          {:error, {:forbidden, trial_error(user)}}
        else
          :ok
        end

      true ->
        reset_at = next_reset_at()

        cond do
          queue.likes_count + queue.passes_count >= @daily_browses_limit ->
            schedule_reset_notification(user, reset_at)
            {:error, :out_of_browses, reset_at}

          type == :like and queue.likes_count >= @daily_likes_limit ->
            schedule_reset_notification(user, reset_at)
            {:error, :out_of_likes, reset_at}

          true ->
            :ok
        end
    end
  end

  defp insert_response(%User{} = user, %User{} = target, type, kind) do
    now = DateTime.utc_now()

    Repo.transaction(fn ->
      existing =
        LikesAndPasses
        |> where(profile_id: ^user.id, target_id: ^target.id, kind: ^kind)
        |> Repo.one()

      if existing, do: Repo.rollback(:already_responded)

      {:ok, _} =
        %LikesAndPasses{
          profile_id: user.id,
          target_id: target.id,
          type: type,
          kind: kind
        }
        |> Repo.insert()

      complete_prospects(user, target, kind, now)

      counter = if type == :like, do: :likes_count, else: :passes_count

      {1, nil} =
        User
        |> where(id: ^user.id)
        |> Repo.update_all(inc: [{counter, 1}])

      {:ok, _} = Queue.increment(user.id, kind, counter, %{undone: false})

      opposite =
        LikesAndPasses.get(
          user_id: target.id,
          target_id: user.id,
          type: :like
        )

      match =
        type == :like and not is_nil(opposite) and User.Policy.can_read?(user, target)

      %{
        match: match,
        match_kind: if(match, do: reduce_kind(kind, opposite.kind), else: nil),
        user_id: target.id
      }
    end)
    |> case do
      {:ok, result} -> {:ok, result}
      {:error, :already_responded} -> {:error, {:conflict, :already_responded}}
      {:error, reason} -> {:error, reason}
    end
  end

  # The acted-on prospect is completed (created on the spot if it wasn't queued,
  # so undo works uniformly); the same target's prospect in the other mode is
  # removed since an action excludes them everywhere.
  defp complete_prospects(user, target, kind, now) do
    case Prospect.get(profile_id: user.id, target_id: target.id, kind: kind) do
      %Prospect{} = prospect ->
        prospect
        |> Ecto.Changeset.change(%{completed_at: now})
        |> Repo.update!()

      nil ->
        %Prospect{
          profile_id: user.id,
          target_id: target.id,
          kind: kind,
          position: Prospect.head_position(user.id, kind) - 1,
          completed_at: now
        }
        |> Repo.insert!()
    end

    Prospect
    |> where(
      [p],
      p.profile_id == ^user.id and p.target_id == ^target.id and p.kind != ^kind
    )
    |> Repo.delete_all()
  end

  defp after_respond(%User{} = user, %User{} = target, result, kind) do
    if result.match do
      {:ok, _} =
        %{user_id: user.id, target_id: target.id, kind: result.match_kind}
        |> ObanWorkers.ProcessMatch.new()
        |> Oban.insert()
    end

    remaining = Prospect.count_uncompleted(user.id, kind)
    queue = Queue.get(user.id, kind)
    maybe_enqueue_compute(user.id, kind, queue, remaining)

    :ok
  end

  def undo(%User{} = user, kind) do
    queue = Queue.get(user.id, kind)

    if queue.undone do
      {:error, {:conflict, :already_undone}}
    else
      case Prospect.last_completed(user.id, kind) do
        nil ->
          {:error, {:conflict, :nothing_to_undo}}

        prospect ->
          undo_prospect(user, prospect, kind)
      end
    end
  end

  defp undo_prospect(%User{} = user, %Prospect{} = prospect, kind) do
    result =
      Repo.transaction(fn ->
        item =
          LikesAndPasses
          |> where(profile_id: ^user.id, target_id: ^prospect.target_id, kind: ^kind)
          |> Repo.one()

        was_match =
          not is_nil(item) and item.type == :like and
            not is_nil(
              LikesAndPasses.get(
                user_id: prospect.target_id,
                target_id: user.id,
                type: :like
              )
            )

        if item, do: Repo.delete!(item)

        prospect
        |> Ecto.Changeset.change(%{
          completed_at: nil,
          position: Prospect.head_position(user.id, kind) - 1
        })
        |> Repo.update!()

        # Undone actions don't count towards the daily limits.
        counter =
          case item do
            %LikesAndPasses{type: :like} -> :likes_count
            _ -> :passes_count
          end

        :ok = Queue.decrement(user.id, kind, counter, %{undone: true})

        was_match
      end)

    with {:ok, was_match} <- result do
      if was_match do
        {:ok, _} =
          %{user_id: user.id, target_id: prospect.target_id}
          |> ObanWorkers.Unmatch.new()
          |> Oban.insert()
      end

      {:ok, prospect}
    end
  end

  def schedule_reset_notification(user, reset_at) do
    if user.preferences.push_notifications.reminders and
         (user.apns_tokens != [] or user.fcm_tokens != []) do
      User.Push.deliver(user, :daily_profiles_ready, reset_at)
    else
      {:ok, :disabled}
    end
  end

  def deliver_match_notification(user, target_user, match_kind) do
    conversation_id = Talkjs.new_conversation_id(user, target_user)

    send_email =
      user.preferences.email_notifications.matches and is_nil(user.banned_at) and
        is_nil(user.deactivated_at)

    send_push =
      user.preferences.push_notifications.matches and
        (user.apns_tokens != [] or user.fcm_tokens != [])

    if target_user.status == :visible and (send_email or send_push) do
      email_result =
        if send_email do
          User.Email.deliver(user, :new_match,
            conversation_id: conversation_id,
            match_kind: match_kind,
            target_user: target_user
          )
        else
          {:ok, :disabled}
        end

      push_result =
        if send_push do
          User.Push.deliver(user, :new_match,
            conversation_id: conversation_id,
            match_kind: match_kind,
            target_user: target_user
          )
        else
          {:ok, :disabled}
        end

      case {email_result, push_result} do
        {{:ok, :disabled}, {:ok, :disabled}} -> {:ok, :disabled}
        {{:ok, _}, {:ok, :disabled}} -> {:ok, :email}
        {{:ok, :disabled}, {:ok, _}} -> {:ok, :push}
        {{:ok, _}, {:ok, _}} -> {:ok, :both}
        {{:error, reason}, _} -> {:error, reason}
        {_, {:error, reason}} -> {:error, reason}
      end
    else
      {:ok, :disabled}
    end
  end

  def create_match_conversation(user_a, user_b, kind) do
    conversation_id = Talkjs.new_conversation_id(user_a, user_b)

    with {:ok, conversation} <-
           Talkjs.update_conversation(
             conversation_id,
             %{
               participants: [ShortUUID.decode!(user_a.id), ShortUUID.decode!(user_b.id)],
               subject: Conversation.encode(:kind, kind)
             }
           ),
         {:ok, _} <-
           Talkjs.create_messages(conversation_id, [
             %{
               text: "It's a match!",
               type: "SystemMessage"
             }
           ]) do
      {:ok, conversation}
    else
      _ -> {:error, nil}
    end
  end
end

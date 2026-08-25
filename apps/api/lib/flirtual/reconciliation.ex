defmodule Flirtual.Reconciliation do
  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.{Chargebee, Entitlement, Repo, RevenueCat, User}
  alias Flirtual.ObanWorkers.Reconcile

  # Webhooks only say that something changed; the providers are authoritative.
  # Each provider is asked what the user holds and the rows are synced to that,
  # one per (store, kind). Promotional grants, consumables and old Stripe
  # purchases have no provider to ask, and are never touched.
  def reconcile(%User{} = user) do
    reconciled_at = DateTime.utc_now() |> DateTime.truncate(:second)

    with {:ok, revenuecat} <- RevenueCat.rows(user),
         {:ok, chargebee} <- Chargebee.rows(user) do
      write(user, revenuecat ++ chargebee, reconciled_at)
    else
      {:error, reason} -> {:retry, reason}
    end
  end

  def entitles_now?(:perpetual), do: true
  def entitles_now?({:until, until}), do: DateTime.after?(until, DateTime.utc_now())
  def entitles_now?(:none), do: false

  def latest(left, right), do: if(DateTime.after?(left, right), do: left, else: right)

  defp write(user, desired, reconciled_at) do
    Repo.transaction(fn ->
      rows =
        Entitlement
        |> where(user_id: ^user.id)
        |> lock("FOR UPDATE")
        |> preload(^Entitlement.default_assoc())
        |> Repo.all()

      # A reconcile that read the providers more recently already landed.
      fresher? =
        Enum.any?(
          rows,
          &(&1.reconciled_at && DateTime.after?(&1.reconciled_at, reconciled_at))
        )

      if fresher?, do: :ok, else: sync(user, rows, desired, reconciled_at)
    end)
    |> case do
      {:ok, _} -> :ok
      {:error, reason} -> {:retry, reason}
    end
  end

  defp sync(user, rows, desired, reconciled_at) do
    {untouched, provider_rows} =
      Enum.split_with(
        rows,
        &(&1.store in [:promotional, :stripe] or &1.kind == :consumable)
      )

    was_premium = Entitlement.premium?(rows)

    desired = Map.new(desired, &{{&1.store, &1.kind}, &1})

    updated =
      Enum.map(provider_rows, fn row ->
        case Map.get(desired, {row.store, row.kind}) do
          nil -> end_row(row, reconciled_at)
          attrs -> row |> change(changes(attrs, reconciled_at)) |> Repo.update!()
        end
      end)

    inserted =
      desired
      |> Map.drop(Enum.map(provider_rows, &{&1.store, &1.kind}))
      |> Map.values()
      |> Enum.map(fn attrs ->
        %Entitlement{user_id: user.id}
        |> change(changes(attrs, reconciled_at))
        |> Repo.insert!()
      end)

    after_rows =
      untouched ++ Enum.map(updated ++ inserted, &Repo.preload(&1, :plan, force: true))

    transition(user, was_premium, Entitlement.premium?(after_rows))
    schedule_lapse(user, after_rows)

    :ok
  end

  defp end_row(row, reconciled_at) do
    if Entitlement.active?(row) do
      row
      |> change(%{
        entitled_until: reconciled_at,
        renews: false,
        renewal_pending: false,
        reconciled_at: reconciled_at
      })
      |> Repo.update!()
    else
      row |> change(%{reconciled_at: reconciled_at}) |> Repo.update!()
    end
  end

  defp changes(attrs, reconciled_at) do
    %{
      kind: attrs.kind,
      store: attrs.store,
      plan_id: attrs.plan_id,
      entitled_until: attrs.entitled_until && DateTime.truncate(attrs.entitled_until, :second),
      renews: attrs.renews,
      renewal_pending: attrs.renewal_pending,
      reconciled_at: reconciled_at
    }
    |> Map.merge(Map.new(attrs.ids))
  end

  defp transition(user, false, true), do: Entitlement.reset_matchmaking_timer(user.profile)
  defp transition(user, true, false), do: Entitlement.reset_premium_settings(user.profile)
  defp transition(_, _, _), do: {:ok, :unchanged}

  defp schedule_lapse(user, rows) do
    rows
    |> Enum.map(& &1.entitled_until)
    |> Enum.reject(&is_nil/1)
    |> Enum.filter(&DateTime.after?(&1, DateTime.utc_now()))
    |> case do
      [] -> {:ok, :none}
      untils -> Reconcile.schedule_lapse(user.id, Enum.min_by(untils, &DateTime.to_unix/1))
    end
  end
end

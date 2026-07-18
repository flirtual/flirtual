defmodule Flirtual.Entitlement do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.Entitlement.Policy

  require Flirtual.Utilities
  import Flirtual.Utilities

  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.{Entitlement, Plan, Profiles, Repo, User}
  alias Flirtual.ObanWorkers.Reconcile

  @kinds [:subscription, :one_time, :consumable]
  @stores [:app_store, :play_store, :chargebee, :stripe, :promotional]

  schema "entitlements" do
    belongs_to(:user, User)
    belongs_to(:plan, Plan)

    field(:active, :string, virtual: true)

    field(:kind, Ecto.Enum, values: @kinds)
    field(:store, Ecto.Enum, values: @stores)

    field(:store_id, :string)

    field(:entitled_until, :utc_datetime)
    field(:renews, :boolean)
    field(:renewal_pending, :boolean)
    field(:quantity, :integer)
    field(:reconciled_at, :utc_datetime)

    timestamps()
  end

  def default_assoc do
    [
      :plan
    ]
  end

  # nil entitled_until is a one-time purchase. Consumables have quantity, not
  # activeness.
  def active?(%Entitlement{kind: :consumable}), do: false
  def active?(%Entitlement{entitled_until: nil}), do: true

  def active?(%Entitlement{entitled_until: entitled_until}),
    do: DateTime.after?(entitled_until, DateTime.utc_now())

  def active?(_), do: false

  def promotional?(%Entitlement{plan_id: plan_id}), do: plan_id == Plan.promotional_id()
  def promotional?(_), do: false

  # Active rows whose plan grants premium. Required the plan preloaded.
  def premium?(entitlements) when is_list(entitlements),
    do: Enum.any?(entitlements, &premium?/1)

  def premium?(%Entitlement{plan: %Plan{product: product}} = entitlement),
    do: product == "premium" and active?(entitlement)

  def premium?(nil), do: false

  def reset_matchmaking_timer(profile) do
    {_, nil} =
      Flirtual.User.Profile.Queue
      |> where(profile_id: ^profile.user_id)
      |> Repo.update_all(set: [likes_count: 0, passes_count: 0, reset_at: nil])

    {:ok, profile}
  end

  def reset_premium_settings(profile) do
    with {:ok, _} <-
           if(profile.custom_weights,
             do:
               profile.custom_weights
               |> change(%{
                 monopoly: 1.0,
                 games: 1.0,
                 default_interests: 1.0,
                 custom_interests: 1.0,
                 personality: 1.0,
                 relationships: 1.0,
                 domsub: 1.0,
                 kinks: 1.0,
                 languages: 1.0,
                 likes: 1.0
               })
               |> Repo.update(),
             else: {:ok, :skipped}
           ),
         {:ok, _} <-
           profile
           |> Profiles.update_colors(%{
             color_1: "#ff8975",
             color_2: "#e9658b"
           }) do
      {:ok, profile}
    end
  end

  # Records which plan and store a purchase came from. Doesn't touch
  # entitled_until; only a reconcile decides entitlement.
  def record(%User{} = user, %Plan{} = plan, store, ids \\ []) when store in @stores do
    kind = if plan.recurring, do: :subscription, else: :one_time

    %Entitlement{}
    |> change(
      Map.merge(
        %{user_id: user.id, plan_id: plan.id, kind: kind, store: store},
        Map.new(ids)
      )
    )
    |> Repo.insert(
      on_conflict: {:replace, [:plan_id, :updated_at] ++ Keyword.keys(ids)},
      conflict_target: [:user_id, :store, :kind],
      returning: true
    )
  end

  def get(user_id: user_id, store: store, kind: kind) when is_uid(user_id) do
    Entitlement
    |> where(user_id: ^user_id, store: ^store, kind: ^kind)
    |> preload(^Entitlement.default_assoc())
    |> Repo.one()
  end

  def get(store_id: store_id) when is_binary(store_id) do
    Entitlement
    |> where(store_id: ^store_id)
    |> preload(^Entitlement.default_assoc())
    |> Repo.one()
  end

  def get(_), do: nil

  def list(user_id: user_id) when is_uid(user_id) do
    Entitlement
    |> where(user_id: ^user_id)
    |> preload(^Entitlement.default_assoc())
    |> Repo.all()
  end

  # Moves the rows only; the reconcile decides whether the target is actually
  # entitled. Move the provider's record of ownership first: Chargebee.transfer/2,
  # or a transfer in the RevenueCat dashboard.
  def reassign(%User{} = source, %User{} = target) do
    Repo.transaction(fn ->
      {count, _} =
        Entitlement
        |> where(user_id: ^source.id)
        |> Repo.update_all(set: [user_id: target.id])

      with {:ok, _} <- reset_premium_settings(source.profile),
           {:ok, _} <- reset_matchmaking_timer(target.profile),
           {:ok, _} <- Reconcile.enqueue(target.id) do
        count
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def grant_promotional(%User{} = user) do
    entitlements = list(user_id: user.id)
    promotional = Enum.find(entitlements, &promotional?/1)

    cond do
      promotional && active?(promotional) ->
        {:ok, promotional}

      Enum.any?(entitlements, &(&1 != promotional and premium?(&1))) ->
        {:error, :existing_subscription}

      true ->
        manual =
          promotional ||
            Enum.find(entitlements, &(&1.store == :promotional and &1.kind == :one_time))

        set_promotional(user, manual || %Entitlement{})
    end
  end

  defp set_promotional(user, entitlement) do
    case Plan.promotional() do
      %Plan{} = plan ->
        Repo.transaction(fn ->
          with {:ok, entitlement} <-
                 entitlement
                 |> change(%{
                   user_id: user.id,
                   plan_id: plan.id,
                   kind: :one_time,
                   store: :promotional,
                   store_id: nil,
                   entitled_until: nil,
                   renews: nil,
                   reconciled_at: nil
                 })
                 |> Repo.insert_or_update(),
               {:ok, _} <- reset_matchmaking_timer(user.profile) do
            entitlement
          else
            {:error, reason} -> Repo.rollback(reason)
            reason -> Repo.rollback(reason)
          end
        end)

      nil ->
        {:error, :promotional_plan_missing}
    end
  end

  def revoke_promotional(%User{} = user) do
    promotional = user.id |> then(&list(user_id: &1)) |> Enum.find(&promotional?/1)

    if promotional && active?(promotional) do
      now = DateTime.utc_now() |> DateTime.truncate(:second)

      Repo.transaction(fn ->
        with {:ok, _} <- reset_premium_settings(user.profile),
             {:ok, entitlement} <-
               promotional |> change(%{entitled_until: now}) |> Repo.update() do
          entitlement
        else
          {:error, reason} -> Repo.rollback(reason)
          reason -> Repo.rollback(reason)
        end
      end)
    else
      {:error, :not_promotional}
    end
  end
end

defimpl Jason.Encoder, for: Flirtual.Entitlement do
  def encode(value, opts) do
    Jason.Encode.map(
      Map.take(value, [
        :id,
        :kind,
        :store,
        :plan,
        :active,
        :entitled_until,
        :renews,
        :renewal_pending,
        :quantity,
        :updated_at,
        :created_at
      ])
      |> Map.filter(fn {_, value} -> value !== nil end),
      opts
    )
  end
end

defmodule Flirtual.Entitlement.Policy do
  use Flirtual.Policy

  alias Flirtual.Entitlement

  def authorize(:read, _, _), do: false
  def authorize(_, _, _), do: false

  def transform(:active, _, %Entitlement{} = entitlement),
    do: Entitlement.active?(entitlement)
end

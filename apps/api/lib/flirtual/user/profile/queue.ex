defmodule Flirtual.User.Profile.Queue do
  use Flirtual.Schema, primary_key: false

  import Ecto.Query

  alias Flirtual.Repo
  alias Flirtual.User.Profile.Queue

  @kinds [:love, :friend]

  schema "queues" do
    belongs_to(:profile, Flirtual.User.Profile, references: :user_id, primary_key: true)

    field(:kind, Ecto.Enum, values: @kinds, primary_key: true)
    field(:requested_at, :utc_datetime_usec)
    field(:computed_at, :utc_datetime_usec)
    field(:fallback_active, :boolean, default: false)
    field(:fallback_notified_at, :utc_datetime)
    field(:filters_updated_at, :utc_datetime)
    # Set when the last recompute found no one, so we stop re-searching until
    # something changes (filters/profile) or the next daily reset.
    field(:exhausted_at, :utc_datetime)
    field(:undone, :boolean, default: false)
    field(:likes_count, :integer, default: 0)
    field(:passes_count, :integer, default: 0)
    field(:reset_at, :utc_datetime)
  end

  def kinds, do: @kinds

  def get(profile_id, kind) do
    Queue
    |> where(profile_id: ^profile_id, kind: ^kind)
    |> Repo.one() ||
      %Queue{profile_id: profile_id, kind: kind}
  end

  def upsert(profile_id, kind, fields) when is_map(fields) do
    replace = Map.keys(fields)

    %Queue{profile_id: profile_id, kind: kind}
    |> Ecto.Changeset.change(fields)
    |> Repo.insert(
      on_conflict: {:replace, replace},
      conflict_target: [:profile_id, :kind]
    )
  end

  def increment(profile_id, kind, counter, fields \\ %{})
      when counter in [:likes_count, :passes_count] do
    %Queue{profile_id: profile_id, kind: kind}
    |> Ecto.Changeset.change(Map.put(fields, counter, 1))
    |> Repo.insert(
      on_conflict: [inc: [{counter, 1}], set: Map.to_list(fields)],
      conflict_target: [:profile_id, :kind]
    )
  end

  def decrement(profile_id, kind, counter, fields \\ %{})
      when counter in [:likes_count, :passes_count] do
    {_, nil} =
      Queue
      |> where(profile_id: ^profile_id, kind: ^kind)
      |> update([queue],
        set: [
          {^counter, fragment("GREATEST(? - 1, 0)", field(queue, ^counter))}
        ]
      )
      |> then(&if(fields == %{}, do: &1, else: update(&1, [queue], set: ^Map.to_list(fields))))
      |> Repo.update_all([])

    :ok
  end

  def touch_filters_updated(profile_id) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    Enum.each(@kinds, fn kind ->
      # Re-arms the fallback notice (see Matchmaking.fallback_notice/2).
      {:ok, _} = upsert(profile_id, kind, %{filters_updated_at: now})
    end)

    :ok
  end
end

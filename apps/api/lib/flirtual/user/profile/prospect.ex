defmodule Flirtual.User.Profile.Prospect do
  use Flirtual.Schema

  import Ecto.Query

  alias Flirtual.Repo
  alias Flirtual.User.Profile.Prospect

  @derive {Jason.Encoder, only: [:kind, :target_id, :position, :fallback, :created_at]}

  schema "prospects" do
    belongs_to(:profile, Flirtual.User.Profile, references: :user_id)
    belongs_to(:target, Flirtual.User.Profile, references: :user_id)

    field(:kind, Ecto.Enum, values: [:love, :friend])
    field(:position, :integer)
    field(:score, :float, default: 0.0)
    field(:fallback, :boolean, default: false)
    field(:completed_at, :utc_datetime_usec)

    timestamps(updated_at: false)
  end

  def get(profile_id: profile_id, target_id: target_id, kind: kind) do
    Prospect
    |> where(profile_id: ^profile_id, target_id: ^target_id, kind: ^kind)
    |> Repo.one()
  end

  def list_uncompleted(profile_id, kind, limit) do
    Prospect
    |> where([p], p.profile_id == ^profile_id and p.kind == ^kind and is_nil(p.completed_at))
    |> order_by(asc: :position, asc: :target_id)
    |> limit(^limit)
    |> Repo.all()
  end

  def count_uncompleted(profile_id, kind) do
    Prospect
    |> where([p], p.profile_id == ^profile_id and p.kind == ^kind and is_nil(p.completed_at))
    |> Repo.aggregate(:count)
  end

  def last_completed(profile_id, kind) do
    Prospect
    |> where([p], p.profile_id == ^profile_id and p.kind == ^kind and not is_nil(p.completed_at))
    |> order_by(desc: :completed_at)
    |> limit(1)
    |> Repo.one()
  end

  def head_position(profile_id, kind) do
    Prospect
    |> where(profile_id: ^profile_id, kind: ^kind)
    |> select([p], min(p.position))
    |> Repo.one() || 0
  end

  def insert_all(prospects) when is_list(prospects) do
    now = DateTime.utc_now()

    with {count, nil} <-
           Repo.insert_all(
             Prospect,
             Enum.map(
               prospects,
               &Map.merge(&1, %{
                 id: Ecto.ShortUUID.generate(),
                 created_at: {:placeholder, :now}
               })
             ),
             on_conflict: {:replace, [:position, :score, :fallback]},
             conflict_target: [:profile_id, :target_id, :kind],
             placeholders: %{now: DateTime.truncate(now, :second)}
           ) do
      {:ok, count}
    end
  end

  def delete_all(target_id: target_id) do
    with {count, nil} <-
           Prospect
           |> where(target_id: ^target_id)
           |> Repo.delete_all() do
      {:ok, count}
    end
  end
end

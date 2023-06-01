defmodule Flirtual.User.Profile.Prospect do
  use Flirtual.Schema

  import Ecto.Query
  import Ecto.Changeset

  alias Flirtual.User.Profile.LikesAndPasses
  alias Flirtual.User.ChangeQueue
  alias Flirtual.Repo
  alias Flirtual.User.Profile.Prospect

  @derive {Jason.Encoder, only: [:kind, :target, :created_at]}

  schema "prospects" do
    belongs_to :profile, Flirtual.User.Profile, references: :user_id
    belongs_to :target, Flirtual.User.Profile, references: :user_id

    field :kind, Ecto.Enum, values: [:love, :friend]
    field :score, :float, default: 0.0
    field :completed, :boolean, default: false

    timestamps(updated_at: false)
  end

  def get(profile_id: profile_id, target_id: target_id) do
    Prospect
    |> where(profile_id: ^profile_id, target_id: ^target_id)
    |> limit(1)
    |> Repo.one()
  end

  def list(profile_id: profile_id, kind: kind) do
    Prospect
    |> where(profile_id: ^profile_id, kind: ^kind, completed: false)
    |> order_by(desc: :score, desc: :target_id)
    |> Repo.all()
  end

  def reverse(%Prospect{profile_id: profile_id, target_id: target_id} = prospect) do
    Repo.transaction(fn ->
      with {:ok, _} <- LikesAndPasses.delete_all(profile_id: profile_id, target_id: target_id),
           {:ok, prospect} <-
             prospect
             |> change(%{completed: false})
             |> Repo.update() do
        prospect
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def insert_all(prospects) when is_list(prospects) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

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
             on_conflict: :replace_all,
             conflict_target: [:profile_id, :target_id, :kind],
             placeholders: %{now: now}
           ) do
      {:ok, count}
    end
  end

  def delete_all(profile_id: profile_id, target_id: target_id) do
    Repo.transaction(fn ->
      with {count, nil} <-
             Prospect
             |> where(profile_id: ^profile_id, target_id: ^target_id)
             |> Repo.delete_all(),
           {:ok, _} <- ChangeQueue.add(profile_id) do
        count
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def delete_all(profile_id: profile_id, kind: kind) do
    Repo.transaction(fn ->
      with {count, nil} <-
             Prospect
             |> where(profile_id: ^profile_id, kind: ^kind)
             |> Repo.delete_all(),
           {:ok, _} <- ChangeQueue.add(profile_id) do
        count
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def delete_all(target_id: target_id) do
    Repo.transaction(fn ->
      with {count, nil} <-
             Prospect
             |> where(target_id: ^target_id)
             |> Repo.delete_all(),
           {:ok, _} <- ChangeQueue.add(target_id) do
        count
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end
end

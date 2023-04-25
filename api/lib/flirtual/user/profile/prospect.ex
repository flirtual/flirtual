defmodule Flirtual.User.Profile.Prospect do
  use Flirtual.Schema

  import Ecto.Query

  alias Flirtual.User.ChangeQueue
  alias Flirtual.Repo
  alias Flirtual.User.Profile.Prospect

  @derive {Jason.Encoder, only: [:kind, :target, :created_at]}

  schema "prospects" do
    belongs_to :profile, Flirtual.User.Profile, references: :user_id
    belongs_to :target, Flirtual.User.Profile, references: :user_id

    field :kind, Ecto.Enum, values: [:love, :friend]

    timestamps()
  end

  def insert_all(prospects) when is_list(prospects) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    with {count, nil} <-
           Repo.insert_all(
             Prospect,
             Enum.map(
               prospects,
               &Map.merge(&1, %{
                 updated_at: {:placeholder, :now},
                 created_at: {:placeholder, :now}
               })
             ),
             on_conflict: :replace_all,
             placeholder: %{now: now}
           ) do
      {:ok, count}
    end
  end

  def delete(profile_id: profile_id, target_id: target_id) do
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

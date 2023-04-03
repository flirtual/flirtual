defmodule Flirtual.User.Profile.LikesAndPasses do
  use Flirtual.Schema

  import Ecto.Query

  alias Flirtual.User.ChangeQueue
  alias Flirtual.Repo
  alias Flirtual.User.Profile.LikesAndPasses

  @derive {Jason.Encoder, only: [:type, :kind, :target, :created_at]}

  schema "likes_and_passes" do
    belongs_to :profile, Flirtual.User.Profile, references: :user_id
    belongs_to :target, Flirtual.User.Profile, references: :user_id

    field :type, Ecto.Enum, values: [:like, :pass]
    field :kind, Ecto.Enum, values: [:love, :friend]

    timestamps()
  end

  def delete_all(profile_id: profile_id) do
    Repo.transaction(fn ->
      with {count, nil} <-
             LikesAndPasses
             |> where(profile_id: ^profile_id)
             |> Repo.delete_all(),
           {:ok, _} <- ChangeQueue.add(profile_id) do
        count
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end
end

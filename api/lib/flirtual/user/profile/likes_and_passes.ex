defmodule Flirtual.User.Profile.LikesAndPasses do
  use Flirtual.Schema

  @derive {Jason.Encoder, only: [:type, :kind, :target, :created_at]}

  schema "likes_and_passes" do
    belongs_to :profile, Flirtual.User.Profile
    belongs_to :target, Flirtual.User.Profile

    field :type, Ecto.Enum, values: [:like, :pass]
    field :kind, Ecto.Enum, values: [:love, :friend]

    timestamps(inserted_at: :created_at)
  end
end

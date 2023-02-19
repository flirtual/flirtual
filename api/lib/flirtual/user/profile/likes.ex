defmodule Flirtual.User.Profile.Likes do
  use Flirtual.Schema

  @derive {Jason.Encoder, only: [:type, :target, :created_at]}

  schema "user_profile_likes" do
    belongs_to :profile, Flirtual.User.Profile
    belongs_to :target, Flirtual.User.Profile

    field :type, Ecto.Enum, values: [:like, :homie]

    timestamps(inserted_at: :created_at)
  end
end

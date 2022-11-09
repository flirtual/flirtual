defmodule Flirtual.User.Profile.Likes do
  use Flirtual.Schema

  alias Flirtual.User

  @derive {Jason.Encoder, only: [:type, :target, :created_at]}

  schema "user_profile_likes" do
    belongs_to :user, User
    belongs_to :target, User

    field :type, Ecto.Enum, values: [:like, :homie]

    timestamps(updated_at: false, inserted_at: :created_at)
  end
end

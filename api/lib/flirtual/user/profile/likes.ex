defmodule Flirtual.User.Profile.Likes do
  use Flirtual.Schema

  alias Flirtual.User

  schema "user_profile_likes" do
    belongs_to :user_id, User
    belongs_to :target_id, User

    field :type, Ecto.Enum, values: [:like, :homie]

    timestamps(updated_at: false)
  end
end

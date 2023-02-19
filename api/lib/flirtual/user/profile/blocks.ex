defmodule Flirtual.User.Profile.Blocks do
  use Flirtual.Schema

  @derive {Jason.Encoder, only: [:target, :created_at]}

  schema "user_profile_blocks" do
    belongs_to :profile, Flirtual.User.Profile
    belongs_to :target, Flirtual.User.Profile

    timestamps(updated_at: false, inserted_at: :created_at)
  end
end

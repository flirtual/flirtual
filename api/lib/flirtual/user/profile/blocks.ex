defmodule Flirtual.User.Profile.Blocks do
  use Flirtual.Schema

  @derive {Jason.Encoder, only: [:target, :created_at]}

  schema "blocks" do
    belongs_to :profile, Flirtual.User.Profile, references: :user_id
    belongs_to :target, Flirtual.User.Profile, references: :user_id

    timestamps(updated_at: false)
  end
end

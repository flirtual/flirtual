defmodule Flirtual.User.Profile.Image do
  use Flirtual.Schema

  alias Flirtual.User.Profile

  @derive {Jason.Encoder, only: [:id, :external_id, :scanned, :updated_at, :created_at]}

  schema "user_profile_images" do
    belongs_to :profile, Profile

    field :external_id, :string
    field :scanned, :boolean, default: false

    timestamps(inserted_at: :created_at)
  end
end

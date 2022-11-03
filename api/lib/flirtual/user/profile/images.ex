defmodule Flirtual.User.Profile.Images do
  use Flirtual.Schema

  alias Flirtual.User.Profile

  schema "user_profile_images" do
    belongs_to :profile, Profile

    field :external_id, :string
    field :scanned, :boolean, default: false
  end
end

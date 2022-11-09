defmodule Flirtual.User.Profile.Preferences do
  use Flirtual.Schema

  alias Flirtual.User.Profile

  @derive {Jason.Encoder, only: [:agemin, :agemax, :gender, :kinks, :updated_at]}

  schema "user_profile_preferences" do
    belongs_to :profile, Profile

    field :agemin, :integer
    field :agemax, :integer
    field :gender, {:array, Ecto.Enum}, values: [:man, :woman, :other]
    field :kinks, {:array, Ecto.Enum}, values: Profile.get_kink_list()

    timestamps(inserted_at: false)
  end
end

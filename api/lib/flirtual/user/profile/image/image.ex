defmodule Flirtual.User.Profile.Image do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.User.Profile.Image.Policy

  alias Flirtual.User.Profile

  schema "user_profile_images" do
    belongs_to :profile, Profile

    field :external_id, :string
    field :scanned, :boolean, default: false
    field :order, :integer

    field :url, :string, virtual: true

    timestamps(inserted_at: :created_at)
  end
end

defimpl Jason.Encoder, for: Flirtual.User.Profile.Image do
  def encode(value, opts) do
    Jason.Encode.map(
      Map.take(value, [:id, :url, :scanned, :updated_at, :created_at])
      |> Map.filter(fn {_, value} -> value !== nil end),
      opts
    )
  end
end

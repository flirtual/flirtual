defmodule Flirtual.User.Profile.CustomFilter do
  use Flirtual.Schema, primary_key: false

  import Ecto.Changeset
  import Flirtual.Utilities.Changeset

  @derive {Jason.Encoder,
           only: [
             :preferred,
             :type,
             :value
           ]}

  schema "profile_custom_filters" do
    belongs_to(:profile, Profile, primary_key: true, references: :user_id)

    field(:preferred, :boolean)
    field(:type, :string, primary_key: true)
    field(:value, :string, primary_key: true)
  end

  def changeset(custom_filter, attrs) do
    custom_filter
    |> cast(attrs, [:profile_id, :preferred, :type, :value])
    |> validate_required([:preferred, :type, :value])
    |> validate_uid(:profile_id)
    |> unique_constraint([:profile_id, :type, :value])
    |> validate_inclusion(:type, [
      "country",
      "game",
      "gender",
      "interest",
      "kink",
      "language",
      "platform",
      "sexuality"
    ])
  end
end

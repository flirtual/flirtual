defmodule Flirtual.User.Connection do
  use Flirtual.Schema

  alias Flirtual.User

  @derive {Jason.Encoder,
           only: [
             :type,
             :external_id,
             :updated_at,
             :created_at
           ]}

  schema "user_connections" do
    belongs_to :user, User

    field :type, Ecto.Enum, values: [:discord, :vrchat]
    field :external_id, :string

    timestamps(inserted_at: :created_at)
  end
end

defmodule Flirtual.User.Connections do
  use Flirtual.Schema

  alias Flirtual.User

  schema "user_connections" do
    belongs_to :user, User

    field :type, Ecto.Enum, values: [:discord, :vrchat]
    field :external_id, :string

    timestamps()
  end
end

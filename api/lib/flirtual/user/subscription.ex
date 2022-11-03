defmodule Flirtual.User.Subscription do
  use Flirtual.Schema

  alias Flirtual.User

  schema "user_subscriptions" do
    belongs_to :user, User

    field :type, Ecto.Enum, values: [:premium, :supporter, :lifetime_premium]
    field :stripe_id, :string
    field :cancelled_at, :naive_datetime

    timestamps()
  end
end

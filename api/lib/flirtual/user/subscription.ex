defmodule Flirtual.User.Subscription do
  use Flirtual.Schema

  alias Flirtual.User

  @derive {Jason.Encoder,
           only: [
             :type,
             :stripe_id,
             :cancelled_at,
             :updated_at,
             :created_at
           ]}

  schema "subscriptions" do
    belongs_to :user, User

    field :type, Ecto.Enum, values: [:premium, :supporter, :lifetime_premium]
    field :stripe_id, :string
    field :cancelled_at, :naive_datetime

    timestamps(inserted_at: :created_at)
  end
end

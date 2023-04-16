defmodule Flirtual.Plan do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.Plan.Policy

  require Flirtual.Utilities
  import Flirtual.Utilities

  import Ecto.Query

  alias Flirtual.Repo
  alias Flirtual.Plan

  schema "plans" do
    field :name, :string

    field :features, {:array, Ecto.Enum},
      values: [:custom_weights],
      default: []

    field :product_id, :string
    field :price_id, :string

    timestamps(updated_at: false)
  end

  def get(plan_id) when is_uuid(plan_id) do
    Plan |> where(id: ^plan_id) |> Repo.one()
  end

  def get(product_id: product_id, price_id: price_id)
      when is_binary(product_id) and is_binary(price_id) do
    Plan |> where(product_id: ^product_id, price_id: ^price_id) |> Repo.one()
  end

  def get(_), do: nil

  def list() do
    Plan |> Repo.all()
  end
end

defimpl Jason.Encoder, for: Flirtual.Plan do
  use Flirtual.Encoder,
    only: [
      :id,
      :name,
      :product_id,
      :price_id,
      :created_at
    ]
end

defmodule Flirtual.Plan.Policy do
  use Flirtual.Policy

  alias Flirtual.Plan

  def authorize(:read, _, _), do: false
  def authorize(_, _, _), do: false

  @admin_properties [
    :product_id,
    :price_id,
    :created_at
  ]

  def transform(
        key,
        %Plug.Conn{
          assigns: %{
            session: session
          }
        },
        %Plan{} = plan
      )
      when key in @admin_properties do
    if :admin in session.user.tags do
      plan[key]
    else
      nil
    end
  end

  def transform(key, _, _)
      when key in @admin_properties,
      do: nil
end

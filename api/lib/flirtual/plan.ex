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

    timestamps(inserted_at: :created_at, updated_at: false)
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
  def encode(value, opts) do
    Jason.Encode.map(
      Map.take(value, [
        :id,
        :name,
        :features,
        :product_id,
        :price_id,
        :created_at
      ])
      |> Map.filter(fn {_, value} -> value !== nil end),
      opts
    )
  end
end

defmodule Flirtual.Plan.Policy do
  use Flirtual.Policy

  alias Flirtual.Plan

  def transform(
        :product_id,
        %Plug.Conn{
          assigns: %{
            session: session
          }
        },
        %Plan{} = plan
      ) do
    if :admin in session.user.tags do
      plan.product_id
    else
      nil
    end
  end

  def transform(:product_id, _, _), do: nil

  def transform(
        :price_id,
        %Plug.Conn{
          assigns: %{
            session: session
          }
        },
        %Plan{} = plan
      ) do
    if :admin in session.user.tags do
      plan.price_id
    else
      nil
    end
  end

  def transform(:price_id, _, _), do: nil

  def transform(
        :created_at,
        %Plug.Conn{
          assigns: %{
            session: session
          }
        },
        %Plan{} = plan
      ) do
    if :admin in session.user.tags do
      plan.created_at
    else
      nil
    end
  end

  def transform(:created_at, _, _), do: nil

  def authorize(:read, _, _), do: false
  def authorize(_, _, _), do: false
end

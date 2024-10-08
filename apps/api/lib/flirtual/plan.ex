defmodule Flirtual.Plan do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.Plan.Policy

  require Flirtual.Utilities
  import Flirtual.Utilities

  import Ecto.Query

  alias Flirtual.Repo
  alias Flirtual.Plan

  schema "plans" do
    field(:name, :string)

    field(:recurring, :boolean, default: true)
    field(:purchasable, :boolean, default: true)

    field(:product_id, :string)
    field(:price_id, :string)
    field(:google_id, :string)
    field(:apple_id, :string)
    field(:chargebee_id, :string)
    field(:revenuecat_id, :string)

    timestamps(updated_at: false)
  end

  def get(plan_id) when is_uid(plan_id) do
    Plan |> where(id: ^plan_id) |> Repo.one()
  end

  def get(product_id: product_id, price_id: price_id)
      when is_binary(product_id) and is_binary(price_id) do
    Plan |> where(product_id: ^product_id, price_id: ^price_id) |> Repo.one()
  end

  def get(chargebee_id: chargebee_id) when is_binary(chargebee_id) do
    Plan |> where(chargebee_id: ^chargebee_id) |> Repo.one()
  end

  def get(revenuecat_id: revenuecat_id) when is_binary(revenuecat_id) do
    Plan |> where(apple_id: ^revenuecat_id) |> or_where(google_id: ^revenuecat_id) |> Repo.one()
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
      :google_id,
      :apple_id,
      :chargebee_id,
      :revenuecat_id,
      :created_at,
      :purchasable
    ]
end

defmodule Flirtual.Plan.Policy do
  use Flirtual.Policy

  def authorize(:read, _, _), do: false
  def authorize(_, _, _), do: false
end

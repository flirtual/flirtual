defmodule Flirtual.Attribute do
  use Flirtual.Schema

  import Ecto.Query

  alias Flirtual.{Attribute, Repo}

  schema "attributes" do
    field :type, :string
    field :name, :string
    field :metadata, :map

    timestamps(inserted_at: false)
  end

  def by_id(attribute_id) do
    Attribute
    |> where(id: ^attribute_id)
    |> Repo.one()
  end

  def by_ids(attribute_ids, attribute_type) do
    Attribute
    |> where([attribute], attribute.id in ^attribute_ids)
    |> where([attribute], attribute.type == ^attribute_type)
    |> Repo.all()
  end

  def by_ids(attribute_ids) do
    Attribute
    |> where([attribute], attribute.id in ^attribute_ids)
    |> Repo.all()
  end

  def by_type(attribute_type) do
    Attribute
    |> where(type: ^attribute_type)
    |> Repo.all()
  end
end

defimpl Jason.Encoder, for: Flirtual.Attribute do
  def encode(value, opts) do
    Jason.Encode.map(
      Map.take(value, [:id, :name, :metadata])
      |> Map.filter(fn {_, value} -> value !== nil end),
      opts
    )
  end
end

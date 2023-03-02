defmodule Flirtual.Attribute do
  use Flirtual.Schema

  import Ecto.Query

  alias Flirtual.{Attribute, Repo}

  alias Flirtual.Languages
  alias Flirtual.Countries

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

  def by_ids(attribute_ids, :type) do
    attribute_ids |> List.flatten() |> by_ids() |> Enum.group_by(& &1.type)
  end

  def by_ids(attribute_ids) do
    Attribute
    |> where([attribute], attribute.id in ^attribute_ids)
    |> Repo.all()
  end

  def by_type("country") do
    Countries.list()
    |> Enum.map(
      &%Attribute{
        id: &1[:iso_3166_1],
        name: &1[:name],
        metadata: %{
          "flag_url" =>
            "https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/4.1.4/flags/4x3/" <>
              &1[:iso_3166_1] <> ".svg"
        }
      }
    )
  end

  def by_type("language") do
    Languages.list()
    |> Enum.map(
      &%Attribute{
        id: &1[:iso_639_1],
        name: &1[:name]
      }
    )
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

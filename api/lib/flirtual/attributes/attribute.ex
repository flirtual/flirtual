defmodule Flirtual.Attribute do
  use Flirtual.Schema

  import Flirtual.Utilities.Changeset
  import Ecto.Changeset
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

  def by_id_explicit(attribute_id, type) do
    Attribute
    |> where(id: ^attribute_id, type: ^type)
    |> Repo.one()
  end

  def exists_id_explicit?(attribute_id, type) do
    Attribute
    |> where(id: ^attribute_id, type: ^type)
    |> Repo.exists?()
  end

  def by_ids(attribute_ids, type) do
    if length(attribute_ids) === 0 do
      []
    else
      Attribute
      |> where([attribute], attribute.id in ^attribute_ids and attribute.type == ^type)
      |> Repo.all()
    end
  end

  def by_ids(attribute_ids) do
    if length(attribute_ids) === 0 do
      []
    else
      Attribute
      |> where([attribute], attribute.id in ^attribute_ids)
      |> Repo.all()
    end
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

  def validate_attribute(changeset, field, attribute_type, options \\ []) do
    changeset
    |> validate_uuid(field)
    |> validate_change(field, fn field, value ->
      if not exists_id_explicit?(value, attribute_type) do
        [{Keyword.get(options, :field, field), "does not exist"}]
      else
        []
      end
    end)
  end

  def validate_attribute_list(changeset, ids, types, changeset_fn \\ & &1, options \\ []) do
    cast_arbitrary(
      types
      |> Enum.map(&{&1, {:array, :map}})
      |> Map.new(fn {k, v} -> {k, v} end)
      |> Map.put(:_, {:array, :string}),
      %{_: ids}
    )
    |> validate_uuids(:_)
    |> then(fn changeset ->
      if not changeset.valid? do
        changeset
      else
        cast(
          changeset,
          get_field(changeset, :_, [])
          |> Attribute.by_ids()
          |> Enum.group_by(& &1.type),
          types
        )
        |> delete_change(:_)
        |> validate_required(Keyword.get(options, :required, []))
        |> changeset_fn.()
      end
    end)
    |> then(
      &(append_changeset_errors(changeset, &1)
        |> put_assoc(
          Keyword.get(options, :field, :attributes),
          Enum.map(types, fn type ->
            get_field(&1, type, [])
          end)
          |> List.flatten()
        ))
    )
  end
end

defimpl Jason.Encoder, for: Flirtual.Attribute do
  def encode(value, opts) do
    Jason.Encode.map(
      Map.take(value, [:id, :type, :name, :metadata])
      |> Map.filter(fn {_, value} -> value !== nil end),
      opts
    )
  end
end

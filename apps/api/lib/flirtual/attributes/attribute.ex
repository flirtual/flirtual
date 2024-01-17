defmodule Flirtual.Attribute do
  use Flirtual.Schema

  require Flirtual.Utilities
  import Flirtual.Utilities

  import Flirtual.Utilities.Changeset
  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.{Attribute, Repo}

  alias Flirtual.Countries
  alias Flirtual.Languages

  @derive {Inspect, only: [:id, :type, :metadata]}

  schema "attributes" do
    field :type, :string
    field :name, :string
    field :order, :integer
    field :metadata, :map

    timestamps(inserted_at: false)
  end

  def get(attribute_id) when is_uid(attribute_id) do
    Attribute
    |> where(id: ^attribute_id)
    |> Repo.one()
  end

  def get(attribute_id) when is_binary(attribute_id) do
    (list(type: "country") ++ list(type: "language"))
    |> Enum.find(&(&1.id == attribute_id))
  end

  def get(_), do: nil

  def get(attribute_id, type) when is_uid(attribute_id) and is_binary(type) do
    Attribute
    |> where(id: ^attribute_id, type: ^type)
    |> Repo.one()
  end

  def get(attribute_id, type) when is_binary(attribute_id) and is_binary(type) do
    list(type: type)
    |> Enum.find(&(&1.id == attribute_id))
  end

  def get(_, _), do: nil

  def list([], _), do: []

  def list(attribute_ids, type) when is_list(attribute_ids) and is_binary(type) do
    Attribute
    |> where([attribute], attribute.id in ^attribute_ids and attribute.type == ^type)
    |> Repo.all()
  end

  def list([]), do: []

  def list(type: "country") do
    Countries.list()
    |> Enum.map(fn country ->
      id =
        country[:iso_3166_1]
        |> Atom.to_string()

      %Attribute{
        id: id,
        type: "country",
        name: country[:name],
        metadata: %{
          "flag_url" =>
            "https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/4.1.4/flags/4x3/" <>
              id <> ".svg"
        }
      }
    end)
  end

  def list(type: "language") do
    Languages.list()
    |> Enum.map(fn language ->
      %Attribute{
        id:
          language[:bcp_47]
          |> Atom.to_string(),
        type: "language",
        name: language[:name]
      }
    end)
  end

  def list(type: attribute_type) when is_binary(attribute_type) do
    Attribute
    |> where(type: ^attribute_type)
    |> order_by([:order, :name])
    |> Repo.all()
  end

  def list(attribute_ids) when is_list(attribute_ids) do
    Attribute
    |> where([attribute], attribute.id in ^attribute_ids)
    |> order_by([:order, :name])
    |> Repo.all()
  end

  def list(_), do: []

  def validate_attribute(changeset, id_key, attribute_type, options \\ []) do
    key =
      Keyword.get(
        options,
        :key,
        id_key
        |> Atom.to_string()
        |> String.replace_suffix("_id", "")
        |> to_atom()
      )

    changeset
    |> validate_uid(id_key)
    |> then(fn changeset ->
      if not changeset.valid? or not changed?(changeset, id_key) do
        changeset
      else
        attribute_id = get_field(changeset, id_key)
        attribute = get(attribute_id, attribute_type)

        if is_nil(attribute) do
          changeset
          |> add_error(id_key, "does not exist")
        else
          changeset
          |> put_change(key, attribute)
        end
      end
    end)
  end

  def validate_attributes(changeset, id_key, type, options \\ []) do
    key =
      Keyword.get(
        options,
        :key,
        id_key
        |> Atom.to_string()
        |> String.replace_suffix("_id", "")
        |> to_atom()
      )

    changeset
    |> then(fn changeset ->
      if not changed?(changeset, id_key) do
        changeset
      else
        attribute_ids = get_field(changeset, id_key)
        attributes = list(attribute_ids, type)

        changeset
        |> put_change(key, attributes)
      end
    end)
  end

  def validate_attribute_list(changeset, ids, types, changeset_fn \\ & &1, options \\ []) do
    required_attributes = Keyword.get(options, :required, [])
    field_name = Keyword.get(options, :field, :attributes)

    cast_arbitrary(
      types
      |> Enum.map(&{&1, {:array, :map}})
      |> Map.new(fn {k, v} -> {k, v} end)
      |> Map.put(:_, {:array, :string}),
      %{_: if(is_nil(ids), do: get_field(changeset, field_name) |> Enum.map(& &1.id), else: ids)}
    )
    |> validate_uids(:_)
    |> then(fn changeset ->
      if not changeset.valid? do
        changeset
      else
        cast(
          changeset,
          get_field(changeset, :_, [])
          |> list()
          |> Enum.group_by(& &1.type),
          types
        )
        |> delete_change(:_)
        |> validate_required(required_attributes)
        |> changeset_fn.()
      end
    end)
    |> then(
      &(append_changeset_errors(changeset, &1)
        |> put_assoc(
          field_name,
          Enum.map(types, fn type ->
            get_field(&1, type, [])
          end)
          |> List.flatten()
        ))
    )
  end

  def normalize_aliases(list) when is_list(list) do
    attribute_aliases =
      list
      |> Enum.map(& &1.metadata["alias_of"])
      |> Attribute.list()

    list
    |> Enum.map(fn attribute ->
      case attribute.metadata["alias_of"] do
        alias_id when is_uid(alias_id) ->
          Enum.find(attribute_aliases, &(&1.id == alias_id))

        _ ->
          attribute
      end
    end)
    |> Enum.uniq_by(& &1.id)
    |> Enum.sort_by(& &1.order)
  end

  def normalize_pairs(list) when is_list(list) do
    attribute_pairs =
      list
      |> Enum.map(& &1.metadata["pair"])
      |> Attribute.list()

    list
    |> Enum.map(fn attribute ->
      case attribute.metadata["pair"] do
        pair_id when is_uid(pair_id) ->
          Enum.find(attribute_pairs, &(&1.id == pair_id))

        _ ->
          attribute
      end
    end)
    |> Enum.uniq_by(& &1.id)
    |> Enum.sort_by(& &1.order)
  end
end

defimpl Jason.Encoder, for: Flirtual.Attribute do
  use Flirtual.Encoder,
    only: [
      :id,
      :type,
      :name,
      :order,
      :metadata
    ]
end

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
    field(:type, :string)
    field(:order, :integer)
    field(:metadata, :map)

    timestamps(inserted_at: false)
  end

  def get(attribute_id) when is_uid(attribute_id) do
    Attribute
    |> where(id: ^attribute_id)
    |> Repo.one()
  end

  def get(attribute_id) when is_binary(attribute_id) do
    (list(type: "country") ++ list(type: "language") ++ list(type: "relationship"))
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
    Countries.list(:iso_3166_1) |> Enum.map(&%Attribute{id: &1, type: "country"})
  end

  def list(type: "language") do
    Languages.list(:bcp_47) |> Enum.map(&%Attribute{id: &1, type: "language"})
  end

  def list(type: "relationship") do
    [
      %Attribute{
        id: "serious",
        type: "relationship"
        # name: "Serious dating"
      },
      %Attribute{
        id: "vr",
        type: "relationship"
        # name: "Casual dating"
      },
      %Attribute{
        id: "hookups",
        type: "relationship"
        # name: "Hookups"
      },
      %Attribute{
        id: "friends",
        type: "relationship"
        # name: "New friends"
      }
    ]
  end

  def list(type: attribute_type) when is_binary(attribute_type) do
    Attribute
    |> where(type: ^attribute_type)
    |> order_by([:order])
    |> Repo.all()
  end

  def list(attribute_ids) when is_list(attribute_ids) do
    Attribute
    |> where([attribute], attribute.id in ^attribute_ids)
    |> order_by([:order])
    |> Repo.all()
  end

  def list(_), do: []

  def compress(attributes) when is_list(attributes), do: Enum.map(attributes, &compress/1)

  def compress(%Attribute{id: id, metadata: metadata})
      when is_nil(metadata) or map_size(metadata) == 0,
      do: id

  def compress(%Attribute{id: id, metadata: metadata}),
    do: Map.put(metadata || %{}, :id, id)

  def group(attributes) do
    Enum.reduce(attributes, %{}, fn %{id: id, type: type}, acc ->
      Map.update(acc, type, [id], fn existing -> [id | existing] end)
    end)
  end

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

  # region [todo: replace with translations]
  def report_reasons(),
    do: %{
      "Ur6iAuTDCktZe3zZQGqtZ2" => "Spam or troll account",
      "wFkctcaaf5B4Ef5i3ggY3G" => "Hateful content",
      "Wf4t9FT7Lmvnn73KqpZGPG" => "Violent or disturbing content",
      "ymWd4JdTqpnBLmGSLmJRvY" => "Nude or NSFW pictures",
      "AFe9ijRg9MYGubm2Efi4Ki" => "Harassment",
      "Ec5fqqgVo5X3s4QCeFUJ6D" => "Impersonating me or someone else",
      "MyexHAyY8gzQjBQ6agCSx3" => "Scam, malware, or harmful links",
      "L6FRU2xjUiZwHUbegAcWTa" => "Advertising or solicitation",
      "zu6HcxQxmJDDq4rmvJazkf" => "Underage user",
      "BtJvp62cJ5vm6CeuCPTP5H" => "Illegal content",
      "vTzgZw4Eexx7fehzCM9PQY" => "Self-harm content",
      "9iwmQ8huhkngyY9BgLDE9W" => "Other"
    }

  def ban_reasons(),
    do: %{
      "tUaxdXYAcyeb3G4Qc7gNLh" => "Spam",
      "WSD2yPcs64FB27qpb4AGuT" => "Impersonation",
      "nupwCrjodUd4ZvPizEBc8L" => "Soliciting money",
      "jBVZ29YcQ2dDXbURb6AxXk" => "Advertising",
      "5H9nMhQacZBD9Zomu7Tbt9" => "Duplicate account",
      "VgQw2st96dZKZotsnYUEaN" => "Ban evasion",
      "muXMqNjneKnwqxT8nqcy4d" => "Underaged",
      "dWDkcjmXQEQRVoXmNkutAB" => "Harassment",
      "hLwvdpKQiofFTCDHox75SY" => "Hateful content",
      "EVU7hHnv5u6eQwRBTW8aYU" => "NSFW content",
      "KfFVwKB4DYMXx7foyqGUZM" => "Violent/disturbing content",
      "YLsXz4iHn9yNLLLmuMHLCT" => "Self-harm content",
      "Lfb829DEo36f54Uu3H3ybj" => "Scam, malware, or harmful links",
      "HmF9W5yHfH3nLRYnt6F2cc" => "Illegal content",
      "8P2pi5232LTpzGTDWkBprc" => "Other"
    }

  def warn_reasons(),
    do: %{
      "V7VcQEiYkiwHr5CHSVx5aS" => "Spam bio & pics",
      "aUurnuPnvjTwU2W3K5Se7X" => "NSFW pic removed",
      "MjxDKasduf9iHTctStGzYA" => "NSFW bio",
      "CnaCPAcsLptyUgVVugubdf" => "Advertising",
      "f8v44XrBausmXe6XybTVHd" => "Soliciting",
      "RdHQQqrswesTTwyh4QZqbH" => "Hateful content",
      "KNJu36SMz87wA5DrJZyc4L" => "Be kind & respectful",
      "dC6h3tWeZueVwHGKLhC2sk" => "Inactive account",
      "AhPZwBpeTm5HMf96bkVszj" => "Upload evidence",
      "pDBkaykWpfYk9w7ZfPzMrb" => "Other"
    }

  # endregion [todo: replace with translations]
end

defimpl Jason.Encoder, for: Flirtual.Attribute do
  use Flirtual.Encoder,
    only: [
      :id,
      :type,
      :order,
      :metadata
    ]
end

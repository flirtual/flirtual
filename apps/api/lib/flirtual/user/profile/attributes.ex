defmodule Flirtual.User.Profile.Attributes do
  use Flirtual.Schema, primary_key: false

  import Ecto.Query
  import Ecto.Changeset

  alias Flirtual.Attribute
  alias Flirtual.Repo
  alias Flirtual.User
  alias Flirtual.User.Profile
  alias Flirtual.User.Profile.Attributes

  schema "profile_attributes" do
    belongs_to(:profile, Profile, references: :user_id, primary_key: true)
    belongs_to(:attribute, Attribute, references: :id, primary_key: true)
  end

  def list(type, order_by: :popularity) when is_binary(type) do
    from(a in Attribute,
      where: a.type == ^type,
      join: b in Attributes,
      on: a.id == b.attribute_id,
      group_by: [a.id],
      order_by: [desc: count(b.attribute_id)]
    )
    |> Repo.all()
  end

  def list(type,
        order_by: :trending,
        recent_days: recent_days,
        recent_boost: recent_boost,
        release_days: release_days,
        release_boost: release_boost
      )
      when is_binary(type) do
    # Users created within (recent_days) are worth (recent_boost)x older users
    recent_cutoff = DateTime.utc_now() |> DateTime.add(-recent_days, :day)

    recent_counts =
      from(a in Attribute,
        where: a.type == ^type,
        left_join: pa in Attributes,
        on: a.id == pa.attribute_id,
        left_join: u in User,
        on: pa.profile_id == u.id and u.status == :visible and u.created_at >= ^recent_cutoff,
        group_by: [a.id],
        select: {a.id, count(u.id)}
      )
      |> Repo.all()
      |> Map.new()

    total_counts =
      from(a in Attribute,
        where: a.type == ^type,
        left_join: pa in Attributes,
        on: a.id == pa.attribute_id,
        left_join: u in User,
        on: pa.profile_id == u.id and u.status == :visible,
        group_by: [a.id],
        select: {a.id, count(u.id)}
      )
      |> Repo.all()
      |> Map.new()

    attributes =
      from(a in Attribute, where: a.type == ^type)
      |> Repo.all()

    total_count = length(attributes)

    scores =
      Enum.map(attributes, fn attr ->
        recent = Map.get(recent_counts, attr.id, 0)
        total = Map.get(total_counts, attr.id, 0)
        recent * (recent_boost - 1) + total
      end)

    max_score = Enum.max(scores, fn -> 0 end)
    now = DateTime.utc_now()

    {curated, uncurated} =
      attributes
      |> Enum.split_with(fn attr -> is_integer(attr.metadata["curated"]) end)

    # Curated attributes are sorted to the top
    curated_sorted = Enum.sort_by(curated, fn attr -> attr.metadata["curated"] end)

    uncurated_sorted =
      uncurated
      |> Enum.sort_by(fn attr ->
        recent = Map.get(recent_counts, attr.id, 0)
        total = Map.get(total_counts, attr.id, 0)
        base_score = recent * (recent_boost - 1) + total

        # Attributes created within (release_days) are boosted by (release_boost) * (max_score)
        # with linear decay
        release_score =
          case attr.created_at do
            nil ->
              0.0

            created_at ->
              age_days = DateTime.diff(now, created_at, :day)
              decay = max(0.0, 1.0 - age_days / release_days)
              max_score * release_boost * decay
          end

        -(base_score + release_score)
      end)

    curated_sorted ++ uncurated_sorted
  end

  def update_order(type, options) do
    Repo.transaction(fn repo ->
      list(type, options)
      |> Enum.with_index()
      |> Enum.map(fn {attribute, order} ->
        with {:ok, attribute} <-
               change(attribute, %{order: order})
               |> repo.update() do
          attribute
        else
          {:error, reason} -> Repo.rollback(reason)
          reason -> Repo.rollback(reason)
        end
      end)
      |> length()
    end)
  end
end

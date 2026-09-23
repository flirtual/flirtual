defmodule Flirtual.ModerationEvent do
  use Flirtual.Schema

  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.{Attribute, ModerationEvent, Repo, User}

  @types [
    :banned,
    :unbanned,
    :indef_shadowbanned,
    :unindef_shadowbanned,
    :warned,
    :warn_revoked,
    :warn_acknowledged,
    :payments_banned,
    :payments_unbanned,
    :image_removed,
    :image_quarantined,
    :flagged_keyword,
    :flagged_bio,
    :flagged_domain,
    :flagged_duplicate,
    :flagged_image,
    :flagged_duplicate_image,
    :flagged_registered_underage,
    :flagged_honeypot,
    :appealed,
    :deleted
  ]

  schema "moderation_events" do
    field(:type, Ecto.Enum, values: @types)

    belongs_to(:user, User)
    belongs_to(:moderator, User)
    belongs_to(:reason, Attribute)

    field(:message, :string)
    field(:automatic, :boolean, default: false)
    field(:details, :map, default: %{})

    field(:reviewed_at, :utc_datetime)
    belongs_to(:reviewer, User, foreign_key: :reviewed_by)

    field(:revoked_at, :utc_datetime)
    belongs_to(:revoker, User, foreign_key: :revoked_by)

    field(:acknowledged_at, :utc_datetime)

    timestamps()
  end

  def types, do: @types

  def default_assoc, do: [:reason]

  @fields [
    :type,
    :user_id,
    :moderator_id,
    :reason_id,
    :message,
    :automatic,
    :details,
    :reviewed_at,
    :reviewed_by,
    :revoked_at,
    :revoked_by,
    :acknowledged_at
  ]

  def changeset(%ModerationEvent{} = event, attrs) do
    event
    |> cast(attrs, @fields)
    |> validate_required([:type])
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:moderator_id)
    |> foreign_key_constraint(:reason_id)
    |> foreign_key_constraint(:reviewed_by)
    |> foreign_key_constraint(:revoked_by)
  end

  def create(type, attrs \\ %{}) when type in @types do
    %ModerationEvent{}
    |> changeset(normalize(attrs) |> Map.put(:type, type))
    |> Repo.insert()
  end

  @associations %{
    user: :user_id,
    moderator: :moderator_id,
    reason: :reason_id
  }

  # Call sites hand over whole structs, since that is what they already hold.
  defp normalize(attrs) do
    Map.new(attrs, fn {key, value} ->
      case Map.fetch(@associations, key) do
        {:ok, field} -> {field, value && value.id}
        :error -> {key, value}
      end
    end)
  end

  def get(id) when is_binary(id) do
    case Ecto.ShortUUID.cast(id) do
      {:ok, id} -> ModerationEvent |> where(id: ^id) |> preload(^default_assoc()) |> Repo.one()
      _ -> nil
    end
  end

  # The action of this type still standing, if any: lifting one revokes its event.
  def active(user_id, type) when is_binary(user_id) and type in @types do
    where_user_types(user_id, [type])
    |> where_active()
    |> order_by([event], desc: event.created_at, desc: event.id)
    |> limit(1)
    |> preload(^default_assoc())
    |> Repo.one()
  end

  # For hot-path checks that only need the reason, without loading the event.
  def active_reason_id(user_id, type) when is_binary(user_id) and type in @types do
    where_user_types(user_id, [type])
    |> where_active()
    |> order_by([event], desc: event.created_at, desc: event.id)
    |> limit(1)
    |> select([event], event.reason_id)
    |> Repo.one()
  end

  def latest(user_id, type) when is_binary(user_id) and type in @types do
    ModerationEvent
    |> where(user_id: ^user_id, type: ^type)
    |> order_by([event], desc: event.created_at, desc: event.id)
    |> limit(1)
    |> preload(^default_assoc())
    |> Repo.one()
  end

  def list(user_id, options \\ []) when is_binary(user_id) do
    ModerationEvent
    |> where(user_id: ^user_id)
    |> then(&if(options[:type], do: where(&1, type: ^options[:type]), else: &1))
    |> then(&if(options[:active], do: where_active(&1), else: &1))
    |> order_by([event], desc: event.created_at, desc: event.id)
    |> limit(^(options[:limit] || 100))
    |> preload(^default_assoc())
    |> Repo.all()
  end

  def revoke(user_id, types, moderator) when is_binary(user_id) and is_list(types) do
    moderator_id = if(match?(%User{}, moderator), do: moderator.id, else: nil)

    where_user_types(user_id, types)
    |> where_active()
    |> Repo.update_all(set: [revoked_at: now(), revoked_by: moderator_id, updated_at: now()])
  end

  def acknowledge(user_id, types) when is_binary(user_id) and is_list(types) do
    where_user_types(user_id, types)
    |> where_active()
    |> where([event], is_nil(event.acknowledged_at))
    |> Repo.update_all(set: [acknowledged_at: now(), updated_at: now()])
  end

  def where_active(query), do: where(query, [event], is_nil(event.revoked_at))

  defp where_user_types(user_id, types) do
    ModerationEvent
    |> where([event], event.user_id == ^user_id and event.type in ^types)
  end

  defp now, do: DateTime.utc_now() |> DateTime.truncate(:second)
end

defimpl Jason.Encoder, for: Flirtual.ModerationEvent do
  use Flirtual.Encoder,
    only: [
      :id,
      :type,
      :user_id,
      :moderator_id,
      :reason_id,
      :message,
      :automatic,
      :details,
      :reviewed_at,
      :reviewed_by,
      :revoked_at,
      :revoked_by,
      :acknowledged_at,
      :created_at
    ]
end

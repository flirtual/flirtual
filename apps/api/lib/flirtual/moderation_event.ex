defmodule Flirtual.ModerationEvent do
  use Flirtual.Schema

  import Ecto.Changeset
  import Ecto.Query
  import Flirtual.Utilities, only: [to_ilike_pattern: 1]

  alias Flirtual.{Attribute, ModerationCursor, ModerationEvent, Repo, User}
  alias Flirtual.User.Profile.Image

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
    :deleted,
    :exit_survey
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

    field(:related, :map, virtual: true)

    timestamps()
  end

  @admin_types [:deleted, :payments_banned, :payments_unbanned, :appealed, :exit_survey]

  @anonymous_types [:exit_survey]

  @duplicate_types [
    "display name",
    "username",
    "email",
    "IP address",
    "device ID",
    "APNS token",
    "FCM token",
    "Discord",
    "VRChat",
    "FaceTime"
  ]

  @reviewable_types [
    :flagged_keyword,
    :flagged_bio,
    :flagged_domain,
    :flagged_duplicate,
    :flagged_image,
    :flagged_duplicate_image,
    :flagged_registered_underage,
    :flagged_honeypot,
    :warn_acknowledged
  ]

  def types, do: @types

  def visible_types(%User{tags: tags}),
    do: if(:admin in tags, do: @types, else: @types -- @admin_types)

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
    |> then(
      &if(options[:types], do: where(&1, [event], event.type in ^options[:types]), else: &1)
    )
    |> then(&if(options[:active], do: where_active(&1), else: &1))
    |> order_by([event], desc: event.created_at, desc: event.id)
    |> limit(^(options[:limit] || 100))
    |> preload(^default_assoc())
    |> Repo.all()
  end

  defmodule Search do
    use Flirtual.EmbeddedSchema

    @optional [
      :event_id,
      :search,
      :types,
      :reason_ids,
      :excluded_duplicate_types,
      :reviewed,
      :order,
      :limit,
      :cursor
    ]

    embedded_schema do
      field(:event_id, Ecto.ShortUUID)
      field(:search, :string, default: "")
      field(:types, {:array, :string})
      field(:reason_ids, {:array, Ecto.ShortUUID}, default: [])
      field(:excluded_duplicate_types, {:array, :string}, default: [])
      field(:reviewed, :boolean, default: false)
      field(:order, :string, default: "desc")
      field(:limit, :integer, default: 100)
      field(:cursor, :string)
    end

    def changeset(value, _, _) do
      value
      |> validate_subset(:types, Enum.map(Flirtual.ModerationEvent.types(), &to_string/1))
      |> validate_subset(
        :excluded_duplicate_types,
        ["connections" | Flirtual.ModerationEvent.duplicate_types()]
      )
      |> validate_inclusion(:order, ["asc", "desc"])
      |> validate_number(:limit, greater_than_or_equal_to: 1, less_than_or_equal_to: 1000)
      |> ModerationCursor.validate(:cursor)
    end
  end

  # Types default to all non-reviewed.
  def search(attrs, visible_types) do
    with {:ok, options} <- Search.apply(attrs) do
      types =
        if(options.types,
          do: Enum.map(options.types, &String.to_existing_atom/1),
          else: visible_types
        )

      order = String.to_existing_atom(options.order)
      {:ok, cursor} = ModerationCursor.parse(options.cursor)

      {:ok,
       ModerationEvent
       |> where([event], event.type in ^Enum.filter(types, &(&1 in visible_types)))
       |> then(&if(options.event_id, do: where(&1, id: ^options.event_id), else: &1))
       |> then(&if(options.reviewed, do: &1, else: where(&1, [event], is_nil(event.reviewed_at))))
       |> where_search(String.trim(options.search), options.reason_ids)
       |> where_duplicate_types(options.excluded_duplicate_types)
       |> ModerationCursor.where_after(cursor, "event", order)
       |> order_by([event], [{^order, event.created_at}, {^order, event.id}])
       |> limit(^options.limit)
       |> Repo.all()}
    end
  end

  # "connections" is every type not in @duplicate_types ("Discord ID" etc).
  defp where_duplicate_types(query, []), do: query

  defp where_duplicate_types(query, excluded) do
    connections = "connections" in excluded

    where(
      query,
      [event],
      event.type != :flagged_duplicate or
        (fragment("coalesce(?->>'type', '') != ALL(?)", event.details, ^excluded) and
           (not (^connections) or
              fragment("?->>'type' = ANY(?)", event.details, ^@duplicate_types)))
    )
  end

  def duplicate_types, do: @duplicate_types

  defp where_search(query, "", _), do: query

  defp where_search(query, search, reason_ids) do
    pattern = to_ilike_pattern(search)

    where(
      query,
      [event],
      (event.user_id in subquery(User.identifier_query(search)) and
         event.type not in ^@anonymous_types) or
        ilike(event.message, ^pattern) or
        event.reason_id in ^reason_ids or
        fragment(
          "concat_ws(' ', ?->>'flags', ?->>'context', ?->>'domain', ?->>'text', ?->>'classification', ?->>'classifications', ?->>'categories', ?->>'reason', ?->>'flags_text', ?->>'reason_text', ?->>'username') ILIKE ?",
          event.details,
          event.details,
          event.details,
          event.details,
          event.details,
          event.details,
          event.details,
          event.details,
          event.details,
          event.details,
          event.details,
          ^pattern
        )
    )
  end

  def review(%ModerationEvent{type: type} = event, %User{} = moderator)
      when type in @reviewable_types do
    event
    |> change(%{reviewed_at: now(), reviewed_by: moderator.id})
    |> Repo.update()
  end

  def review(_, _), do: {:error, {:bad_request, :not_reviewable}}

  def anonymous_types, do: @anonymous_types

  # Exit surveys are anonymous.
  def anonymize(events) when is_list(events),
    do: Enum.map(events, &if(&1.type in @anonymous_types, do: %{&1 | user_id: nil}, else: &1))

  # Bans, profile images and quarantine links each event refers to, loaded per list.
  def with_related(events) when is_list(events) do
    active_bans = events |> Enum.flat_map(&duplicate_user_ids/1) |> active_bans_by_user_id()
    bans_by_id = events |> Enum.flat_map(&appealed_ban_ids/1) |> bans_by_id()
    lifted_bans = lifted_bans(events)
    images = events |> Enum.flat_map(&image_ids/1) |> images_by_id()

    Enum.map(events, fn event ->
      related =
        %{
          duplicate_bans:
            event
            |> duplicate_user_ids()
            |> Enum.map(&active_bans[&1])
            |> Enum.reject(&is_nil/1),
          ban:
            case event.type do
              :appealed -> event |> appealed_ban_ids() |> Enum.find_value(&bans_by_id[&1])
              :unbanned -> lifted_bans[event.id]
              _ -> nil
            end,
          images:
            event
            |> image_ids()
            |> Enum.map(&images[&1])
            |> Enum.reject(&is_nil/1)
            |> Enum.map(&%{image: &1, user_id: &1.profile_id}),
          quarantine_url: quarantine_url(event)
        }
        |> Map.reject(fn {_, value} -> value in [nil, []] end)

      %{event | related: related}
    end)
  end

  defp duplicate_user_ids(%ModerationEvent{details: %{"duplicate_user_ids" => ids}})
       when is_list(ids) do
    Enum.flat_map(ids, fn id ->
      case Ecto.ShortUUID.cast(id) do
        {:ok, id} -> [id]
        _ -> []
      end
    end)
  end

  defp duplicate_user_ids(_), do: []

  defp active_bans_by_user_id([]), do: %{}

  defp active_bans_by_user_id(user_ids) do
    ModerationEvent
    |> where([event], event.type == :banned and event.user_id in ^Enum.uniq(user_ids))
    |> where_active()
    |> order_by([event], asc: event.created_at, asc: event.id)
    |> Repo.all()
    |> Map.new(&{&1.user_id, &1})
  end

  defp appealed_ban_ids(%ModerationEvent{type: :appealed, details: %{"ban_id" => id}})
       when is_binary(id) do
    case Ecto.ShortUUID.cast(id) do
      {:ok, id} -> [id]
      _ -> []
    end
  end

  defp appealed_ban_ids(_), do: []

  defp bans_by_id([]), do: %{}

  defp bans_by_id(ids) do
    ModerationEvent
    |> where([event], event.type == :banned and event.id in ^ids)
    |> Repo.all()
    |> Map.new(&{&1.id, &1})
  end

  # The ban an unban lifted: the user's last ban before it.
  defp lifted_bans(events) do
    unbans = Enum.filter(events, &(&1.type == :unbanned and is_binary(&1.user_id)))
    user_ids = unbans |> Enum.map(& &1.user_id) |> Enum.uniq()

    bans =
      if user_ids == [],
        do: [],
        else:
          ModerationEvent
          |> where([event], event.type == :banned and event.user_id in ^user_ids)
          |> order_by([event], desc: event.created_at, desc: event.id)
          |> Repo.all()

    Map.new(unbans, fn unban ->
      {unban.id,
       Enum.find(
         bans,
         &(&1.user_id == unban.user_id and
             DateTime.compare(&1.created_at, unban.created_at) != :gt)
       )}
    end)
  end

  defp image_ids(%ModerationEvent{details: details}) do
    [details["image_id"] | List.wrap(details["match_image_ids"])]
    |> Enum.filter(&is_binary/1)
    |> Enum.flat_map(fn id ->
      case Ecto.ShortUUID.cast(id) do
        {:ok, id} -> [id]
        _ -> []
      end
    end)
  end

  defp images_by_id([]), do: %{}

  defp images_by_id(ids) do
    Image
    |> where([image], image.id in ^Enum.uniq(ids))
    |> Repo.all()
    |> Map.new(&{&1.id, &1})
  end

  # Quarantined images are in R2. The hostname starts with the account id.
  defp quarantine_url(%ModerationEvent{type: :image_quarantined, details: %{"key" => key}})
       when is_binary(key) do
    case Application.get_env(:ex_aws, :s3)[:host] do
      host when is_binary(host) ->
        account_id = host |> String.split(".") |> List.first()

        "https://dash.cloudflare.com/#{account_id}/r2/default/buckets/quarantine/objects/#{key}/details"

      _ ->
        nil
    end
  end

  defp quarantine_url(_), do: nil

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
      :related,
      :created_at
    ]
end

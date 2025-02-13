defmodule Flirtual.User do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.User.Policy

  require Flirtual.Utilities
  import Flirtual.Utilities

  import Ecto.Changeset
  import Ecto.Query
  import Flirtual.Utilities

  alias Ecto.Changeset

  alias Flirtual.{
    Attribute,
    Discord,
    Flag,
    Hash,
    Languages,
    ObanWorkers,
    Repo,
    Report,
    Subscription,
    User
  }

  alias Flirtual.User.Profile.{Block, Image, LikesAndPasses}
  alias Flirtual.User.{Profile, Relationship, Session}

  @tags [:admin, :moderator, :beta_tester, :debugger, :verified, :legacy_vrlfp, :translating]

  @statuses [
    "visible",
    "finished_profile",
    "onboarded",
    "registered"
  ]

  @status_atoms @statuses |> Enum.map(&String.to_atom/1)

  @derive {Inspect,
           only: [
             :id,
             :slug,
             :email
           ]}

  schema "users" do
    field(:email, :string)
    field(:previous_email, :string)
    field(:username, :string)
    field(:slug, :string)
    field(:password_hash, :string, redact: true)
    field(:talkjs_id, :string, virtual: true)
    field(:talkjs_signature, :string, redact: true)
    field(:listmonk_id, :integer)
    field(:unsubscribe_token, Ecto.ShortUUID)
    field(:apns_token, :string)
    field(:fcm_token, :string)
    field(:platforms, {:array, :string})
    field(:push_count, :integer)
    field(:rating_prompts, :integer)
    field(:stripe_id, :string)
    field(:chargebee_id, :string)
    field(:revenuecat_id, Ecto.ShortUUID)
    field(:status, Ecto.Enum, values: @status_atoms, default: :registered)
    field(:moderator_message, :string)
    field(:moderator_note, :string)
    field(:tns_discord_in_biography, :utc_datetime)
    field(:likes_count, :integer, default: 0)
    field(:passes_count, :integer, default: 0)

    field(:password, :string, virtual: true, redact: true)
    field(:relationship, :map, virtual: true)

    field(:tags, {:array, Ecto.Enum},
      values: @tags,
      default: []
    )

    field(:born_at, :date)
    field(:email_confirmed_at, :utc_datetime)
    field(:deactivated_at, :utc_datetime)
    field(:banned_at, :utc_datetime)
    field(:shadowbanned_at, :utc_datetime)
    field(:indef_shadowbanned_at, :utc_datetime)
    field(:payments_banned_at, :utc_datetime)
    field(:active_at, :utc_datetime)

    has_many(:connections, Flirtual.Connection)
    has_many(:sessions, Flirtual.User.Session)
    has_many(:passkeys, Flirtual.User.Passkey)

    has_one(:preferences, Flirtual.User.Preferences)
    has_one(:subscription, Subscription)
    has_one(:profile, Flirtual.User.Profile)

    timestamps()
  end

  def default_assoc do
    [
      subscription: Flirtual.Subscription.default_assoc(),
      connections: Flirtual.Connection.default_assoc(),
      passkeys: Flirtual.User.Passkey.default_assoc(),
      preferences: Flirtual.User.Preferences.default_assoc(),
      profile: Flirtual.User.Profile.default_assoc()
    ]
  end

  def avatar_url(%User{} = user), do: avatar_url(user, "profile")

  def avatar_url(%User{} = user, variant) when is_binary(variant) do
    Enum.at(user.profile.images, 0)
    |> Image.url(variant)
  end

  def url(%User{} = user) do
    Application.fetch_env!(:flirtual, :frontend_origin)
    |> URI.merge("/#{user.slug}")
  end

  def display_name(%User{} = user) do
    user.profile[:display_name] || user.slug
  end

  def display_name(%User{id: user_id}, deleted: true) do
    "Deleted " <>
      (:crypto.hash(:sha, user_id)
       |> Base.encode16(case: :lower)
       |> String.slice(0..8))
  end

  def pronouns(_) do
    %{
      subjective: "they",
      objective: "them",
      possessive_adjective: "their",
      possessive_pronoun: "theirs",
      reflexive: "themself"
    }

    # masculine_genders = ["He/Him", "Man", "Cis Man", "Trans Man", "Transmasculine"]
    # feminine_genders = ["She/Her", "Woman", "Cis Woman", "Trans Woman", "Transfeminine"]

    # genders =
    #   user.profile.attributes
    #   |> filter_by(:type, "gender")
    #   |> Enum.map(& &1.name)

    # cond do
    #   Enum.all?(genders, fn gender -> gender in masculine_genders end) or
    #       ("He/Him" in genders and not ("They/Them" in genders or "She/Her" in genders)) ->
    #     %{
    #       subjective: "he",
    #       objective: "him",
    #       possessive_adjective: "his",
    #       possessive_pronoun: "his",
    #       reflexive: "himself"
    #     }
    #   Enum.all?(genders, fn gender -> gender in feminine_genders end) or
    #       ("She/Her" in genders and not ("They/Them" in genders or "He/Him" in genders)) ->
    #     %{
    #       subjective: "she",
    #       objective: "her",
    #       possessive_adjective: "her",
    #       possessive_pronoun: "hers",
    #       reflexive: "herself"
    #     }
    #   true ->
    #     %{
    #       subjective: "they",
    #       objective: "them",
    #       possessive_adjective: "their",
    #       possessive_pronoun: "theirs",
    #       reflexive: "themself"
    #     }
    # end
  end

  def update_status(%User{} = user) do
    new_status = get_status(Repo.preload(user, User.default_assoc()))

    user
    |> change(%{status: new_status})
    |> Repo.update()
  end

  def get_status(%User{} = user) do
    cond do
      visible?(user) -> :visible
      finished_profile?(user) -> :finished_profile
      onboarded?(user) -> :onboarded
      true -> :registered
    end
  end

  def onboarded?(%User{} = user) do
    %{profile: profile} = user

    not is_nil(user.born_at) and
      not Enum.empty?(filter_by(profile.attributes, :type, "gender")) and
      not Enum.empty?(filter_by(profile.attributes, :type, "game")) and
      not Enum.empty?(
        filter_by(profile.attributes, :type, "interest") ++ profile.custom_interests
      ) and
      not Enum.empty?(filter_by(profile.preferences.attributes, :type, "gender"))
  end

  def finished_profile?(%User{} = user) do
    %{profile: profile} = user

    onboarded?(user) and
      not is_nil(profile.display_name) and
      not is_nil(profile.biography) and String.length(profile.biography) >= 48 and
      not Enum.empty?(profile.images)
  end

  def visible?(%User{} = user) do
    finished_profile?(user) and
      not is_nil(user.email_confirmed_at) and
      is_nil(user.banned_at) and
      is_nil(user.shadowbanned_at) and
      is_nil(user.indef_shadowbanned_at) and
      is_nil(user.deactivated_at)
  end

  def preview(%User{} = user) do
    %{
      id: user.id,
      name: display_name(user),
      age: get_years_since(user.born_at),
      dark: user.preferences.theme === :dark,
      avatar_url: avatar_url(user, "profile"),
      attributes:
        [
          if(user.preferences.privacy.country === :everyone and user.profile.country,
            do: Attribute.get(Atom.to_string(user.profile.country), "country"),
            else: nil
          )
          | user.profile.attributes
            |> Attribute.normalize_aliases()
            |> Enum.filter(&(&1.type in ["gender", "sexuality", "interest"]))
            |> Enum.map(
              &%{
                id: &1.id,
                type: &1.type,
                name: &1.name
              }
            )
        ]
        |> Enum.filter(&(not is_nil(&1)))
    }
  end

  def blocked?(%User{} = user, %User{} = target) do
    Block.exists?(user: user, target: target)
  end

  def blocked?(user_id, target_id) do
    Block.exists?(user_id: user_id, target_id: target_id)
  end

  def time_diff(%User{} = user, %User{} = target) do
    case {user.profile.timezone, target.profile.timezone} do
      {nil, _} -> nil
      {_, nil} -> nil
      {user_tz, target_tz} ->
        Timex.Timezone.get(user_tz).offset_utc - Timex.Timezone.get(target_tz).offset_utc
    end
  end

  def time_diff(user_id, target_id) do
    timezones = Repo.all(
      from p in Profile,
      where: p.user_id in ^[user_id, target_id],
      select: {p.user_id, p.timezone}
    ) |> Map.new()

    case {timezones[user_id], timezones[target_id]} do
      {nil, _} -> nil
      {_, nil} -> nil
      {user_tz, target_tz} ->
        Timex.Timezone.get(user_tz).offset_utc - Timex.Timezone.get(target_tz).offset_utc
    end
  end

  def relationship(%User{} = user, %User{} = target) do
    Relationship.get(user, target)
  end

  def with_relationship(
        %User{
          relationship: %Relationship{
            user_id: user_id
          }
        } = user,
        %User{
          id: user_id
        }
      ),
      do: user

  def with_relationship(%User{} = user, nil) do
    user
    |> Map.put(:relationship, nil)
  end

  def with_relationship(%User{} = user, %User{} = target) do
    user
    |> Map.put(:relationship, relationship(target, user))
  end

  def matched?(%User{} = user, %User{} = target) do
    LikesAndPasses.match_exists?(user: user, target: target)
  end

  def changeset(user, attrs, options \\ []) do
    user
    |> cast(attrs, [
      :born_at,
      :slug,
      :tns_discord_in_biography
    ])
    |> validate_required(Keyword.get(options, :required, []))
    |> validate_change(:born_at, fn _, born_at ->
      now = Date.utc_today()

      if Date.compare(
           born_at,
           Date.new!(
             now.year - 18,
             now.month,
             if(
               Date.leap_year?(now) and now.month == 2 and now.day == 29,
               do: 28,
               else: now.day
             )
           )
         ) === :gt do
        %{born_at: "too_young"}
      else
        if Date.compare(born_at, Date.new!(1900, 1, 2)) === :lt do
          %{born_at: "too_old"}
        else
          %{}
        end
      end
    end)
    |> validate_unique_slug()
  end

  def get(id) when is_uid(id) do
    User |> where(id: ^id) |> preload(^default_assoc()) |> Repo.one()
  end

  def get(stripe_id: stripe_id) when is_binary(stripe_id) do
    User |> where(stripe_id: ^stripe_id) |> preload(^default_assoc()) |> Repo.one()
  end

  def get(chargebee_id: chargebee_id) when is_binary(chargebee_id) do
    User |> where(chargebee_id: ^chargebee_id) |> preload(^default_assoc()) |> Repo.one()
  end

  def get(revenuecat_id: revenuecat_id) when is_binary(revenuecat_id) do
    User |> where(revenuecat_id: ^revenuecat_id) |> preload(^default_assoc()) |> Repo.one()
  end

  def get(_), do: nil

  def or_where_ilike(query, {as, key}, value, similarity_order)
      when is_atom(as) and is_atom(key) do
    query
    |> or_where([{^as, q}], ilike(field(q, ^key), ^"%#{value}%"))
    |> maybe_ilike_similarity({as, key}, value, similarity_order)
  end

  def or_where_ilike(query, key, value, similarity_order) when is_atom(key) do
    case User.__schema__(:type, key) do
      Ecto.ShortUUID ->
        case is_uid(value) do
          true -> or_where(query, [user], field(user, ^key) == ^value)
          false -> query
        end

      _ ->
        or_where(query, [user], ilike(field(user, ^key), ^"%#{value}%"))
        |> maybe_ilike_similarity(key, value, similarity_order)
    end
  end

  defp maybe_ilike_similarity(query, _, _, nil), do: query

  defp maybe_ilike_similarity(query, key, value, similarity_order),
    do: ilike_similarity(query, key, value, similarity_order)

  defp ilike_similarity(query, {as, key}, value, similarity_order) when is_atom(key) do
    order_by(query, [{^as, q}], [
      {^similarity_order, fragment("similarity(?, ?)", field(q, ^key), ^value)}
    ])
  end

  defp ilike_similarity(query, key, value, similarity_order) when is_atom(key) do
    order_by(query, [user], [
      {^similarity_order, fragment("similarity(?, ?)", field(user, ^key), ^value)}
    ])
  end

  defmodule Search do
    use Flirtual.EmbeddedSchema

    @optional [
      :search,
      :status,
      :tags,
      :sort,
      :order,
      :limit,
      :before,
      :after
    ]

    embedded_schema do
      field(:search, :string, default: "")
      field(:status, :string)
      field(:tags, {:array, :string})

      field(:sort, :string, default: "created_at")
      field(:order, :string, default: "desc")

      # Pagination options.
      field(:limit, :integer, default: 10)
      field(:page, :integer, default: 1)
    end

    def changeset(value, _, _) do
      value
      |> validate_number(:limit, greater_than_or_equal_to: 1, less_than_or_equal_to: 100)
    end
  end

  def paginate(query, page, size) do
    query
    |> limit(^size)
    |> offset(^size * (^page - 1))
  end

  # Order determines priority of similarity.
  @default_search_fields [
    :id,
    {:profile, :display_name},
    :slug,
    :username,
    {:connections, :uid},
    {:connections, :display_name},
    {:profile, :vrchat},
    {:profile, :discord},
    {:profile, :facetime},
    :email,
    :previous_email,
    :stripe_id,
    :chargebee_id,
    :revenuecat_id,
    {:profile, :biography}
  ]

  def search(attrs) do
    attrs =
      Map.update(attrs, "tags", [], fn tags ->
        case tags do
          nil -> []
          tags when is_binary(tags) -> String.split(tags, ",", trim: true)
          tags when is_list(tags) -> tags
          _ -> []
        end
      end)

    Repo.transaction(fn ->
      with {:ok, attrs} <- Search.apply(attrs),
           value when is_binary(value) <-
             attrs
             |> Map.get(:search, "")
             |> String.trim(),
           sort_order = if(attrs.order === "asc", do: :asc_nulls_first, else: :desc_nulls_last),
           query <-
             User
             # |> preload(^default_assoc())
             |> join(:left, [user], profile in assoc(user, :profile), as: :profile)
             |> join(:left, [user], connections in assoc(user, :connections), as: :connections),
           query <-
             (case value do
                "" ->
                  query

                value when is_binary(value) ->
                  similarity_order = if(attrs.sort === "similarity", do: sort_order, else: nil)

                  Enum.reduce(@default_search_fields, query, fn field, query ->
                    or_where_ilike(
                      query,
                      field,
                      value,
                      similarity_order
                    )
                  end)
              end),
           query <-
             (case attrs.status do
                status when status in @statuses ->
                  where(query, [user], user.status == ^attrs.status)

                _ ->
                  query
              end),
           query <-
             (case attrs.tags do
                tags when is_list(tags) ->
                  Enum.reduce(attrs.tags, query, fn tag, query ->
                    where(query, [user], ^tag in user.tags)
                  end)

                _ ->
                  query
              end),
           order = [{:desc, :id}],
           order =
             (case attrs.sort do
                "similarity" ->
                  order

                _ ->
                  Keyword.put(order, sort_order, String.to_existing_atom(attrs.sort))
              end),
           entries when is_list(entries) <-
             query
             |> order_by([user], ^order)
             |> paginate(attrs.page, attrs.limit)
             |> select([user], user.id)
             |> Repo.all() do
        %{
          entries: entries,
          metadata: %{
            page: attrs.page,
            limit: attrs.limit
          }
        }
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def search(_, _), do: []

  def suspend(
        %User{} = user,
        %Attribute{type: "ban-reason"} = reason,
        message,
        %User{} = moderator
      ) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)
    message = message || reason.metadata["details"]

    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> change(%{banned_at: now})
             |> Repo.update(),
           {:ok, _} <- Report.list(target_id: user.id) |> Report.clear_all(moderator, true),
           {:ok, user} <- User.update_status(user),
           {:ok, _} <- ObanWorkers.update_user(user.id, [:elasticsearch, :listmonk, :talkjs]),
           {_, _} <- Session.delete(user_id: user.id),
           User.Email.deliver(user, :suspended, message),
           :ok <-
             Discord.deliver_webhook(:suspended,
               user: user,
               moderator: moderator,
               reason: reason,
               message: message
             ) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def unsuspend(%User{} = user, %User{} = moderator) do
    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> change(%{banned_at: nil, shadowbanned_at: nil, indef_shadowbanned_at: nil})
             |> Repo.update(),
           {:ok, user} <- User.update_status(user),
           {:ok, _} <-
             ObanWorkers.update_user(user.id, [:elasticsearch, :listmonk, :premium_reset, :talkjs]),
           :ok <-
             Discord.deliver_webhook(:unsuspended,
               user: user,
               moderator: moderator
             ) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def indef_shadowban(%User{} = user, %User{} = moderator) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> change(%{indef_shadowbanned_at: now})
             |> Repo.update(),
           {:ok, user} <- User.update_status(user),
           {:ok, _} <-
             ObanWorkers.update_user(user.id, [:elasticsearch, :listmonk, :premium_reset, :talkjs]),
           :ok <-
             Discord.deliver_webhook(:indef_shadowbanned,
               user: user,
               moderator: moderator
             ) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def unindef_shadowban(%User{} = user, %User{} = moderator) do
    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> change(%{indef_shadowbanned_at: nil, shadowbanned_at: nil})
             |> Repo.update(),
           {:ok, user} <- User.update_status(user),
           {:ok, _} <-
             ObanWorkers.update_user(user.id, [:elasticsearch, :listmonk, :premium_reset, :talkjs]),
           :ok <-
             Discord.deliver_webhook(:unindef_shadowbanned,
               user: user,
               moderator: moderator
             ) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def payments_ban(%User{} = user) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> change(%{payments_banned_at: now})
             |> Repo.update() do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def payments_unban(%User{} = user) do
    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> change(%{payments_banned_at: nil})
             |> Repo.update() do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def warn(
        %User{} = user,
        message,
        shadowban,
        %User{} = moderator
      ) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> change(%{
               moderator_message: message,
               shadowbanned_at: if(shadowban, do: now, else: user.shadowbanned_at)
             })
             |> Repo.update(),
           {:ok, user} <- User.update_status(user),
           {:ok, _} <-
             ObanWorkers.update_user(if(shadowban, do: user.id, else: []), [
               :elasticsearch,
               :talkjs
             ]),
           :ok <-
             Discord.deliver_webhook(:warned,
               user: user,
               moderator: moderator,
               message: message,
               at: now
             ) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def revoke_warn(
        %User{} = user,
        %User{} = moderator
      ) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> change(%{moderator_message: nil})
             |> Repo.update(),
           {:ok, _} <- Report.maybe_resolve_shadowban(user.id),
           :ok <-
             Discord.deliver_webhook(:warn_revoked,
               user: user,
               moderator: moderator,
               at: now
             ) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def acknowledge_warn(%User{} = user) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)
    message = user.moderator_message

    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> change(%{moderator_message: nil})
             |> Repo.update(),
           {:ok, _} <- Report.maybe_resolve_shadowban(user.id),
           :ok <-
             Discord.deliver_webhook(:warn_acknowledged,
               user: user,
               at: now,
               message: message
             ) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def add_note(
        %User{} = user,
        message
      ) do
    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> change(%{moderator_note: message})
             |> Repo.update() do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def remove_note(%User{} = user) do
    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> change(%{moderator_note: nil})
             |> Repo.update() do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def update_platforms(%User{} = user) do
    platforms =
      user
      |> Repo.preload(:sessions)
      |> Map.get(:sessions)
      |> Enum.map(& &1.platform)
      |> Enum.uniq()

    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> change(%{platforms: platforms})
             |> Repo.update() do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def update_push_tokens(%User{} = user, attrs) do
    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> change(%{apns_token: attrs["apns_token"], fcm_token: attrs["fcm_token"]})
             |> Repo.update(),
           :ok <- Hash.check_hash(user.id, "APNS token", attrs["apns_token"]),
           :ok <- Hash.check_hash(user.id, "FCM token", attrs["fcm_token"]) do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def increment_push_count(%User{} = user) do
    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> change(%{push_count: user.push_count + 1})
             |> Repo.update() do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def reset_push_count(%User{} = user) do
    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> change(%{push_count: 0})
             |> Repo.update() do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def update_rating_prompts(%User{} = user, attrs) do
    Repo.transaction(fn ->
      with {:ok, user} <-
             user
             |> change(%{rating_prompts: attrs["rating_prompts"]})
             |> Repo.update() do
        user
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def validate_slug(changeset) do
    changeset
    |> validate_required([:slug])
    |> validate_format(:slug, ~r/^[a-zA-Z0-9_]+$/,
      message: "must only contain letters, numbers, or underscores"
    )
    |> validate_length(:slug, min: 3, max: 20)
  end

  def validate_unique_slug(changeset) do
    changeset
    |> validate_slug()
    |> unsafe_validate_unique(:slug, Repo, query: from(User))
    |> unique_constraint(:slug)
    |> Flag.validate_allowed_slug(:slug)
  end

  def validate_email(changeset) do
    changeset
    |> validate_required([:email])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/, message: "must have the @ sign and no spaces")
    |> validate_length(:email, max: 254)
  end

  def validate_unique_email(changeset) do
    changeset
    |> validate_email()
    |> unsafe_validate_unique(:email, Repo, query: from(User))
    |> unique_constraint(:email)
  end

  def validate_password(changeset) do
    changeset
    |> validate_required([:password])
    |> validate_length(:password, min: 8, max: 72, count: :bytes)
    |> check_for_leaked_password()
  end

  defp check_for_leaked_password(%Changeset{changes: %{password: password}} = changeset) do
    password
    |> LeakedPasswords.leaked?()
    |> process_leaked_check(changeset)
  end

  defp check_for_leaked_password(changeset), do: changeset

  defp process_leaked_check(false, changeset), do: changeset

  defp process_leaked_check(_, changeset) do
    add_error(changeset, :password, "leaked_password")
  end

  def validate_password_confirmation(changeset, options \\ []) do
    message = Keyword.get(options, :message, :password_does_not_match)
    changeset |> validate_confirmation(:password, message: message)
  end

  def put_password(%Changeset{} = changeset), do: put_password(changeset, :password)

  def put_password(%Changeset{} = changeset, field) when is_atom(field) do
    password = get_field(changeset, field)

    changeset
    |> put_password(password)
    |> delete_change(field)
  end

  def put_password(value, password) when is_binary(password) do
    change(value, %{password_hash: Bcrypt.hash_pwd_salt(password)})
  end

  def update_password(%User{} = user, password) do
    with {:ok, user} <-
           user
           |> put_password(password)
           |> Repo.update(),
         {_, _} <- Session.delete(user_id: user.id) do
      {:ok, user}
    end
  end

  @doc """
  A user changeset for changing the email.

  It requires the email to change otherwise an error is added.
  """
  def update_email_changeset(user, attrs) do
    user
    |> cast(attrs, [:email])
    |> validate_unique_email()
    |> put_change(:previous_email, user.email)
    |> put_change(:email_confirmed_at, nil)
  end

  def confirm_email_changeset(user) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)
    user |> change(email_confirmed_at: now)
  end

  @doc """
  Verifies the password.

  If there is no user or the user doesn't have a password, we call
  `Bcrypt.no_user_verify/0` to avoid timing attacks.
  """
  def valid_password?(%User{password_hash: password_hash}, password) do
    valid_password?(password_hash, password)
  end

  def valid_password?(password_hash, password)
      when is_binary(password_hash) and byte_size(password) > 0 do
    Bcrypt.verify_pass(password, password_hash)
  end

  def valid_password?(_, _) do
    Bcrypt.no_user_verify()
    false
  end

  @doc """
  Validates the current password otherwise adds an error to the changeset.
  """
  def validate_current_password(changeset, user, options \\ []) do
    field = Keyword.get(options, :field, :current_password)

    if valid_password?(user, get_field(changeset, field)) do
      changeset
    else
      add_error(changeset, field, "invalid_password")
    end
  end
end

defimpl Elasticsearch.Document, for: Flirtual.User do
  alias Flirtual.Attribute
  import Flirtual.Utilities
  import Ecto.Query

  alias Flirtual.User.Profile.LikesAndPasses
  alias Flirtual.User
  alias Flirtual.Repo

  def id(%User{} = user), do: user.id
  def routing(_), do: false

  def encode(%User{} = user) do
    profile = user.profile

    attributes =
      profile.attributes
      |> Attribute.normalize_aliases()
      |> then(
        &if(user.preferences.nsfw,
          do: &1,
          else: exclude_by(&1, :type, "kink")
        )
      )
      |> Enum.map(& &1.id)
      |> Enum.sort()

    attributes_lf =
      profile.preferences.attributes
      |> then(
        &if(user.preferences.nsfw,
          do:
            &1 ++
              (profile.attributes
               |> filter_by(:type, "kink")
               |> Attribute.normalize_pairs()),
          else: exclude_by(&1, :type, "kink")
        )
      )
      |> Enum.map(& &1.id)
      |> Enum.sort()

    document =
      Map.merge(
        %{
          id: user.id,
          dob: user.born_at,
          active_at: user.active_at,
          platforms: user.platforms,
          agemin: profile.preferences.agemin || 18,
          agemax: profile.preferences.agemax || 128,
          openness: profile.openness,
          conscientiousness: profile.conscientiousness,
          agreeableness: profile.agreeableness,
          custom_interests:
            profile.custom_interests
            |> Enum.map(
              &(&1
                |> String.downcase()
                |> String.replace(~r/[^[:alnum:]]/u, ""))
            ),
          attributes: attributes,
          attributes_lf: attributes_lf,
          country: profile.country,
          monopoly: profile.monopoly,
          relationships: profile.relationships,
          nsfw: user.preferences.nsfw,
          languages: profile.languages,
          liked:
            LikesAndPasses
            |> where(profile_id: ^profile.user_id, type: :like)
            |> select([item], item.target_id)
            |> Repo.all(),
          hidden_from_nonvisible: user.tns_discord_in_biography !== nil
        },
        if(user.preferences.nsfw,
          do: %{
            domsub: user.profile.domsub
          },
          else: %{}
        )
      )

    document
  end
end

defimpl Jason.Encoder, for: Flirtual.User do
  use Flirtual.Encoder,
    only: [
      :id,
      :email,
      :slug,
      :born_at,
      :moderator_message,
      :moderator_note,
      :talkjs_signature,
      :apns_token,
      :fcm_token,
      :platforms,
      :push_count,
      :rating_prompts,
      :talkjs_id,
      :stripe_id,
      :chargebee_id,
      :revenuecat_id,
      :banned_at,
      :shadowbanned_at,
      :indef_shadowbanned_at,
      :payments_banned_at,
      :email_confirmed_at,
      :deactivated_at,
      :active_at,
      :tags,
      :status,
      # :relationship,
      # :matched,
      # :blocked,
      :subscription,
      :tns_discord_in_biography,
      :preferences,
      :profile,
      :connections,
      :passkeys,
      :updated_at,
      :created_at
    ]
end

defimpl Swoosh.Email.Recipient, for: Flirtual.User do
  alias Flirtual.User

  def format(%User{} = user) do
    {User.display_name(user), user.email}
  end
end

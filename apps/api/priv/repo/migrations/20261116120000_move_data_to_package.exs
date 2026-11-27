defmodule Flirtual.Repo.Migrations.MoveDataToPackage do
  use Ecto.Migration

  alias Flirtual.Data.{
    BanReason,
    DeleteReason,
    Game,
    Gender,
    Interest,
    InterestCategory,
    Kink,
    Plan,
    Platform,
    Prompt,
    ReportReason,
    Sexuality,
    WarnReason
  }

  # Each data entry keeps the ShortUUID of its old `attributes` (or `plans`) row as
  # `internal.legacy_id`, which maps every stored reference to its readable id.

  @profile_types %{
    "gender" => :genders,
    "sexuality" => :sexualities,
    "interest" => :interests,
    "game" => :games,
    "platform" => :platforms,
    "kink" => :kinks
  }

  @preference_types %{"gender" => :genders, "kink" => :kinks}

  @references [
    {:reports, :reason_id},
    {:moderation_events, :reason_id},
    {:profile_prompts, :prompt_id},
    {:profile_advanced_filters, :attribute_id}
  ]

  @types [
    BanReason,
    DeleteReason,
    Game,
    Gender,
    Interest,
    InterestCategory,
    Kink,
    Platform,
    Prompt,
    ReportReason,
    Sexuality,
    WarnReason
  ]

  def up do
    alter table(:profiles) do
      for {_, column} <- @profile_types,
          do: add(column, {:array, :text}, null: false, default: [])
    end

    alter table(:profile_preferences) do
      for {_, column} <- @preference_types,
          do: add(column, {:array, :text}, null: false, default: [])
    end

    drop constraint(:reports, "reports_reason_id_fkey")
    drop constraint(:moderation_events, "moderation_events_reason_id_fkey")
    drop constraint(:profile_prompts, "profile_prompts_prompt_id_fkey")
    drop constraint(:profile_advanced_filters, "profile_advanced_filters_attribute_id_fkey")

    for {table, column} <- @references do
      execute "alter table #{table} alter column #{column} type text using #{column}::text"
    end

    flush()

    execute """
    create temporary table attribute_ids (uuid text primary key, id text not null)
    on commit drop
    """

    flush()

    # Entries added since have no `legacy_id`, and no old row holds them.
    {uuids, ids} =
      [Plan | @types]
      |> Enum.flat_map(& &1.all())
      |> Enum.filter(& &1.internal["legacy_id"])
      |> Enum.map(&{ShortUUID.decode!(&1.internal["legacy_id"]), &1.id})
      |> Enum.unzip()

    repo().query!("insert into attribute_ids select * from unnest($1::text[], $2::text[])", [
      uuids,
      ids
    ])

    for {table, column} <- @references do
      execute """
      update #{table} set #{column} = attribute_ids.id
      from attribute_ids where attribute_ids.uuid = #{table}.#{column}
      """
    end

    execute links("profiles", "user_id", "profile_attributes", "profile_id", @profile_types)

    execute links(
              "profile_preferences",
              "profile_id",
              "profile_preference_attributes",
              "preferences_id",
              @preference_types
            )

    drop constraint(:profile_advanced_filters, :attribute_or_value)
    drop index(:profile_advanced_filters, [], name: :profile_advanced_filters_unique_index)

    # Ids are case-sensitive, so the column can't stay citext.
    execute "alter table profile_advanced_filters alter column value type text"

    execute """
    update profile_advanced_filters set value = attribute_id where attribute_id is not null
    """

    alter table(:profile_advanced_filters) do
      remove :attribute_id
      modify :value, :text, null: false
    end

    create unique_index(:profile_advanced_filters, [:profile_id, :kind, :category, :value])

    drop constraint(:entitlements, "subscriptions_plan_id_fkey")
    execute "alter table entitlements alter column plan_id type text using plan_id::text"

    execute """
    update entitlements set plan_id = attribute_ids.id
    from attribute_ids where attribute_ids.uuid = entitlements.plan_id
    """

    drop table(:plans)

    drop table(:profile_attributes)
    drop table(:profile_preference_attributes)
    drop table(:attributes)

    # The search index hashes these ids, so every document needs rebuilding with the new ones.
    repo().insert!(Flirtual.ObanWorkers.SearchIndex.new(%{"reindex" => true}))
  end

  # Links of a type without a column (or to an id the data doesn't have) are dropped.
  defp links(table, key, links, link_key, types) do
    columns =
      Enum.map_join(types, ",\n", fn {_, column} ->
        "#{column} = coalesce(grouped.#{column}, '{}')"
      end)

    aggregates =
      Enum.map_join(types, ",\n", fn {type, column} ->
        "array_agg(attribute_ids.id order by attribute_ids.id) filter (where attributes.type = '#{type}') as #{column}"
      end)

    """
    update #{table} set
    #{columns}
    from (
      select links.#{link_key} as key,
      #{aggregates}
      from #{links} as links
      join attributes on attributes.id = links.attribute_id
      join attribute_ids on attribute_ids.uuid = links.attribute_id::text
      group by links.#{link_key}
    ) as grouped
    where grouped.key = #{table}.#{key}
    """
  end
end

defmodule Flirtual.Search do
  # Matchmaking search: Manticore over MySQL protocol. String ids and boost
  # tokens mapped through a 63-bit hash; the original user id is stored in uid.

  use Flirtual.Logger, :search

  import Bitwise
  import Ecto.Query

  alias Flirtual.Matchmaking.Query
  alias Flirtual.ObanWorkers
  alias Flirtual.Repo
  alias Flirtual.Search
  alias Flirtual.User
  alias Flirtual.User.Profile.LikesAndPasses

  @table "profiles"
  @columns "(id, uid, dob, active_at, agemin, agemax, openness, conscientiousness, agreeableness, attributes, attributes_lf, country, languages, boosts, nsfw, hidden_from_nonvisible, tz_norm, has_geo, lat, lon, like_multiplier)"

  # Timezone sentinel: the tz factor is zeroed at or above this, so a missing
  # timezone never earns a proximity boost.
  @tz_missing 999
  @ln2 0.6931471805599453

  @reindex_batch_size 250

  def search(%Query{} = query) do
    with {:ok, rows} <- query_rows(compile(query)) do
      {:ok, Enum.map(rows, &%{user_id: &1["uid"], score: &1["wscore"]})}
    end
  end

  def index_users(users) when is_list(users) do
    users |> Enum.map(&Search.Document.encode/1) |> bulk_index()
  end

  def delete_users(user_ids) when is_list(user_ids), do: bulk_delete(user_ids)

  def bootstrap do
    case create_table() do
      :ok -> maybe_enqueue_reindex()
      {:error, reason} -> log(:warning, ["bootstrap"], reason)
    end
  end

  # A connected-but-empty index (new/wiped volume) rebuilds itself.
  # Uniqueness prevents a cluster from queuing multiple reindexes.
  defp maybe_enqueue_reindex do
    with {:ok, [%{"c" => 0}]} <- query_rows("SELECT COUNT(*) c FROM #{@table}") do
      {:ok, _} =
        %{"reindex" => true}
        |> ObanWorkers.SearchIndex.new(
          unique: [period: 300, states: [:available, :scheduled, :executing]]
        )
        |> Oban.insert()

      log(:info, ["bootstrap"], :reindex_enqueued)
    end

    :ok
  end

  def healthy? do
    match?(
      {:ok, %{rows: [_ | _]}},
      Ecto.Adapters.SQL.query(Search.Repo, "SELECT id FROM #{@table} LIMIT 1", [],
        query_type: :text
      )
    )
  end

  def reindex_all do
    stream_user_batches(fn users ->
      visible = Enum.filter(users, &(&1.status == :visible))
      invisible_ids = users |> Enum.filter(&(&1.status != :visible)) |> Enum.map(& &1.id)

      with :ok <- if(visible == [], do: :ok, else: index_users(visible)) do
        if(invisible_ids == [], do: :ok, else: delete_users(invisible_ids))
      end
    end)
  end

  defp stream_user_batches(fun) do
    User
    |> select([user], user.id)
    |> Repo.all()
    |> Enum.chunk_every(@reindex_batch_size)
    |> Enum.each(fn ids ->
      users =
        User
        |> where([user], user.id in ^ids)
        |> preload(^User.default_assoc())
        |> Repo.all()

      :ok = fun.(users)
    end)
  end

  defp create_table do
    # Manticore's `int` is unsigned, so every column that can hold a negative
    # value (personality poles, normalized timezone) must be a signed `bigint`
    # or the scoring expressions see a wrapped 32-bit value.
    exec("""
    CREATE TABLE IF NOT EXISTS #{@table} (
      uid string,
      dob bigint, active_at bigint,
      agemin bigint, agemax bigint,
      openness bigint, conscientiousness bigint, agreeableness bigint,
      attributes multi64, attributes_lf multi64,
      country bigint,
      languages multi64,
      boosts multi64,
      nsfw bool, hidden_from_nonvisible bool,
      tz_norm bigint,
      has_geo bool, lat float, lon float,
      like_multiplier float
    )
    """)
  end

  # Refresh a user's pickiness weight (see LikesAndPasses.like_multiplier/1).
  def update_like_multiplier(user_id) do
    exec(
      "UPDATE #{@table} SET like_multiplier = #{fl(LikesAndPasses.like_multiplier(user_id))} " <>
        "WHERE id = #{h(user_id)}"
    )
  end

  def bulk_index([]), do: :ok

  def bulk_index(docs) do
    values = docs |> Enum.map(&to_row/1) |> Enum.map_join(",", &row_values/1)
    exec("REPLACE INTO #{@table} #{@columns} VALUES #{values}")
  end

  def bulk_delete([]), do: :ok

  def bulk_delete(user_ids) do
    exec("DELETE FROM #{@table} WHERE id IN (#{Enum.map_join(user_ids, ",", &h/1)})")
  end

  defp to_row(doc) do
    {has_geo, lat, lon} =
      case doc.geolocation do
        {lat, lon} -> {1, lat, lon}
        nil -> {0, 0.0, 0.0}
      end

    %{
      like_multiplier: LikesAndPasses.like_multiplier(doc.id),
      id: h(doc.id),
      uid: doc.id,
      dob: unix(doc.dob),
      active_at: unix(doc.active_at),
      agemin: doc.agemin,
      agemax: doc.agemax,
      openness: doc.openness,
      conscientiousness: doc.conscientiousness,
      agreeableness: doc.agreeableness,
      attributes: hashes(doc.attributes),
      attributes_lf: hashes(doc.attributes_lf),
      country: (doc.country && h(to_string(doc.country))) || 0,
      languages: doc.languages |> Enum.map(&to_string/1) |> hashes(),
      boosts: hashes(doc.boosts),
      nsfw: bool01(doc.nsfw),
      hidden_from_nonvisible: bool01(doc.hidden_from_nonvisible),
      tz_norm: doc.tz_norm || @tz_missing,
      has_geo: has_geo,
      lat: lat,
      lon: lon
    }
  end

  defp row_values(row) do
    "(#{row.id},'#{esc(row.uid)}',#{row.dob},#{row.active_at},#{row.agemin},#{row.agemax}," <>
      "#{row.openness},#{row.conscientiousness},#{row.agreeableness}," <>
      "(#{Enum.join(row.attributes, ",")}),(#{Enum.join(row.attributes_lf, ",")}),#{row.country}," <>
      "(#{Enum.join(row.languages, ",")}),(#{Enum.join(row.boosts, ",")}),#{row.nsfw}," <>
      "#{row.hidden_from_nonvisible},#{row.tz_norm},#{row.has_geo},#{fl(row.lat)},#{fl(row.lon)}," <>
      "#{fl(row.like_multiplier)})"
  end

  def compile(%Query{} = query) do
    "SELECT uid, (#{compile_weight(query)}) AS wscore FROM #{@table} " <>
      "WHERE #{compile_where(query)} " <>
      "ORDER BY wscore DESC LIMIT #{query.size} OPTION max_matches=#{max(query.size, 1000)}"
  end

  defp compile_where(%Query{} = query) do
    [
      case query.exclude_ids do
        [] -> nil
        ids -> "id NOT IN (#{Enum.map_join(ids, ",", &h/1)})"
      end
      | Enum.map(query.filters, &compile_filter/1)
    ]
    |> Enum.reject(&is_nil/1)
    |> Enum.join(" AND ")
  end

  defp compile_filter({:term, field, false}), do: "#{field} = 0"
  defp compile_filter({:term, field, true}), do: "#{field} = 1"
  defp compile_filter({:terms, field, values}), do: "#{field} IN (#{hash_list(values)})"
  defp compile_filter({:none_of, field, values}), do: "#{field} NOT IN (#{hash_list(values)})"

  defp compile_filter({:range, field, ops}) do
    ops
    |> Enum.map_join(" AND ", fn
      {:lte, value} -> "#{field} <= #{range_value(value)}"
      {:gte, value} -> "#{field} >= #{range_value(value)}"
    end)
  end

  defp hash_list(values), do: Enum.map_join(values, ",", &h/1)

  defp range_value(%Date{} = date), do: Integer.to_string(unix(date))
  defp range_value(value) when is_integer(value), do: Integer.to_string(value)

  defp compile_weight(%Query{factors: factors} = query) do
    case factors |> Enum.map(&compile_factor(&1, query)) |> Enum.reject(&is_nil/1) do
      [] -> "0"
      terms -> Enum.join(terms, " + ")
    end
  end

  defp compile_factor({:token, token, weight}, _query),
    do: "#{fl(weight)}*IN(boosts,#{h(token)})"

  defp compile_factor({:token_missing, token, :geolocation, weight}, _query),
    do: "#{fl(weight)}*IF(has_geo=0,IN(boosts,#{h(token)}),0)"

  defp compile_factor({:token_missing, token, :tz_norm, weight}, _query),
    do: "#{fl(weight)}*IF(tz_norm<900,0,IN(boosts,#{h(token)}))"

  # Scaled by the candidate's pickiness weight, so a selective user's like is
  # worth more in the queue of whoever they liked.
  defp compile_factor({:liked_me, _weight}, %Query{liked_me_ids: []}), do: nil

  defp compile_factor({:liked_me, weight}, %Query{liked_me_ids: ids}),
    do: "#{fl(weight)}*IN(id,#{hash_list(ids)})*like_multiplier"

  defp compile_factor({:none_of_boost, tokens, weight}, _query),
    do: "#{fl(weight)}*IF(IN(boosts,#{hash_list(tokens)})=0,1,0)"

  defp compile_factor({:personality, origins, weight}, _query) do
    origins
    |> Enum.map_join(" + ", fn {trait, origin} ->
      d = "ABS(#{trait}-#{origin})/6.0"
      "#{fl(weight)}*IF(1-#{d}>0,1-#{d},0)"
    end)
  end

  defp compile_factor({:tz, target, weight}, _query) do
    diff = "ABS(tz_norm-#{target})"
    circular = "IF(#{diff}<48-#{diff},#{diff},48-#{diff})"
    tri = "1-#{circular}/12.0"
    "#{fl(weight)}*IF(tz_norm<900,IF(#{tri}>0,#{tri},0),0)"
  end

  defp compile_factor({:active, weight}, _query) do
    elapsed = "(#{now()}-active_at)/86400.0-1"
    "#{fl(weight)}*exp(-#{@ln2}*IF(#{elapsed}>0,#{elapsed},0)/7.0)"
  end

  defp compile_factor({:geo, {lat, lon}, weight}, _query) do
    dist = "geodist(lat,lon,#{fl(lat)},#{fl(lon)},{in=deg,out=km})"
    decay = "exp(-#{@ln2}*IF(#{dist}-100>0,#{dist}-100,0)/4000.0)"
    "#{fl(weight)}*IF(has_geo,#{decay},0)"
  end

  defp compile_factor({:age_closeness, origin, offset_days, weight}, _query) do
    delta = "ABS(dob-#{unix(origin)})/86400.0-#{offset_days}"
    "#{fl(weight)}*exp(-#{@ln2}*IF(#{delta}>0,#{delta},0)/1825.0)"
  end

  defp compile_factor({:reverse_age, age, weight}, _query) do
    outside = "IF(agemin-#{age}>#{age}-agemax,agemin-#{age},#{age}-agemax)"
    "#{fl(weight)}*exp(-#{@ln2}*IF(#{outside}>0,#{outside},0)/5.0)"
  end

  defp compile_factor({:random, weight}, _query), do: "#{fl(weight)}*RAND()"

  # 63-bit hash of a string; the doc id can never be 0, and mapping a rare zero
  # to one consistently keeps all fields collision-equivalent.
  defp h(term) do
    <<n::unsigned-integer-size(64), _::binary>> = :crypto.hash(:sha256, to_string(term))
    max(n &&& 0x7FFFFFFFFFFFFFFF, 1)
  end

  defp hashes(list), do: Enum.map(list, &h/1)

  defp bool01(true), do: 1
  defp bool01(_), do: 0

  defp unix(nil), do: 0
  defp unix(%DateTime{} = datetime), do: DateTime.to_unix(datetime)

  defp unix(%Date{} = date),
    do: date |> DateTime.new!(~T[00:00:00], "Etc/UTC") |> DateTime.to_unix()

  defp unix(%NaiveDateTime{} = naive),
    do: naive |> DateTime.from_naive!("Etc/UTC") |> DateTime.to_unix()

  defp now, do: System.os_time(:second)

  defp fl(value) when is_integer(value), do: "#{value}.0"
  defp fl(value), do: to_string(value)

  defp esc(value), do: value |> to_string() |> String.replace("'", "''")

  defp exec(sql) do
    case Ecto.Adapters.SQL.query(Search.Repo, sql, [], query_type: :text) do
      {:ok, _} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  defp query_rows(sql) do
    case Ecto.Adapters.SQL.query(Search.Repo, sql, [], query_type: :text) do
      {:ok, %{columns: columns, rows: rows}} ->
        {:ok, Enum.map(rows, fn row -> Map.new(Enum.zip(columns, row)) end)}

      {:error, reason} ->
        {:error, reason}
    end
  end
end

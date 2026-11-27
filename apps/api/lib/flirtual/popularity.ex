defmodule Flirtual.Popularity do
  # Each node scores on its own, at boot and then daily: Oban runs a job on one node only,
  # so it couldn't refresh the others' tables.
  use GenServer

  alias Flirtual.Data.Game
  alias Flirtual.Repo

  @table :popularity
  @interval :timer.hours(24)

  @recent_days 90
  @recent_boost 10
  @release_days 180
  @release_boost 0.01

  def start_link([]) do
    GenServer.start_link(__MODULE__, [], name: __MODULE__)
  end

  @impl true
  def init([]) do
    :ets.new(@table, [:set, :named_table, :public, read_concurrency: true])
    if refresh?(), do: send(self(), :refresh)
    {:ok, %{}}
  end

  @impl true
  def handle_info(:refresh, state) do
    Task.start(&update/0)
    Process.send_after(self(), :refresh, @interval)
    {:noreply, state}
  end

  defp refresh?, do: Application.get_env(:flirtual, __MODULE__, [])[:refresh] != false

  def scores do
    case :ets.lookup(@table, Game) do
      [{Game, scores}] -> scores
      [] -> %{}
    end
  end

  def update do
    :ets.insert(@table, {Game, trending()})
    :ok
  end

  defp trending do
    entries = Game.all()
    today = Date.utc_today()

    counts = counts(entries, DateTime.add(DateTime.utc_now(), -@recent_days, :day))

    base_scores =
      Map.new(entries, fn entry ->
        {recent, total} = Map.get(counts, entry.id, {0, 0})
        {entry.id, recent * (@recent_boost - 1) + total}
      end)

    max_score = base_scores |> Map.values() |> Enum.max(fn -> 0 end)

    Map.new(entries, fn entry ->
      release_score =
        case entry.internal["added"] do
          nil ->
            0.0

          added ->
            age_days = Date.diff(today, Date.from_iso8601!(added))
            max_score * @release_boost * max(0.0, 1.0 - age_days / @release_days)
        end

      {entry.id, base_scores[entry.id] + release_score}
    end)
  end

  defp counts([], _), do: %{}

  defp counts(entries, recent_cutoff) do
    %{rows: rows} =
      Repo.query!(
        """
        select game_id, count(*) filter (where users.created_at >= $1), count(*)
        from profiles
        join users on users.id = profiles.user_id and users.status = 'visible'
        cross join lateral unnest(profiles.games) as game_id
        where game_id = any($2)
        group by game_id
        """,
        [
          recent_cutoff,
          Enum.map(entries, & &1.id)
        ]
      )

    Map.new(rows, fn [id, recent, total] ->
      {id, {recent, total}}
    end)
  end
end

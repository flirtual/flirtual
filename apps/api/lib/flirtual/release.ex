defmodule Flirtual.Release do
  @moduledoc """
  Used for executing DB release tasks when run in production without Mix
  installed.
  """

  alias DBConnection.ConnectionError

  require Logger

  @app :flirtual

  # A stopped database starts on the next connection, which has to wait for it.
  # https://fly.io/docs/postgres/managing/scale-to-zero/
  @connection_attempts 10
  @pause_between_attempts 3_000

  def migrate do
    load_app()

    for repo <- repos() do
      {:ok, _, _} =
        retrying_disconnects(fn ->
          Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :up, all: true))
        end)
    end
  end

  @doc false
  def retrying_disconnects(task, pause \\ @pause_between_attempts, attempt \\ 1) do
    task.()
  rescue
    error in ConnectionError ->
      if attempt == @connection_attempts, do: reraise(error, __STACKTRACE__)

      Logger.warning("The database isn't up yet (#{error.message}); retrying.")
      Process.sleep(pause)
      retrying_disconnects(task, pause, attempt + 1)
  end

  def rollback(repo, version) do
    load_app()
    {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :down, to: version))
  end

  defp repos do
    Application.fetch_env!(@app, :ecto_repos)
  end

  defp load_app do
    Application.load(@app)
  end
end

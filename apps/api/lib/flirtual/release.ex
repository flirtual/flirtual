defmodule Flirtual.Release do
  @moduledoc """
  Used for executing DB release tasks when run in production without Mix
  installed.
  """
  import Ecto.Query

  @app :flirtual

  # The rows a new database starts with, by table, from priv/repo/exports.
  @seeds ["attributes", "plans"]

  def migrate do
    load_app()

    for repo <- repos() do
      {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :up, all: true))
    end
  end

  # Seeds each table only while it's empty, so it runs on every deploy but fills a database once.
  def seed do
    load_app()

    {:ok, _, _} =
      Ecto.Migrator.with_repo(Flirtual.Repo, fn repo ->
        for table <- @seeds, not repo.exists?(from(row in table, select: 1)) do
          {:ok, _} = repo.transaction(fn -> seed!(repo, table) end)
        end
      end)
  end

  defp seed!(repo, table) do
    Application.app_dir(@app, "priv/repo/exports/#{table}.sql")
    |> File.read!()
    |> String.split(";\n", trim: true)
    |> Enum.each(&Ecto.Adapters.SQL.query!(repo, &1))
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

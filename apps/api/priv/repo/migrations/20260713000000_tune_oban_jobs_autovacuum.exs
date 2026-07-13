defmodule Flirtual.Repo.Migrations.TuneObanJobsAutovacuum do
  use Ecto.Migration

  # oban_jobs is very high-churn; the default scale-factor-based autovacuum lets
  # dead tuples accumulate before a vacuum triggers, bloating the table. Vacuum
  # on a fixed row threshold instead to keep it lean between prunes.
  # https://hexdocs.pm/oban/scaling.html#pruning
  def up do
    execute(
      "ALTER TABLE oban_jobs SET (autovacuum_vacuum_scale_factor = 0, autovacuum_vacuum_threshold = 100)"
    )
  end

  def down do
    execute(
      "ALTER TABLE oban_jobs RESET (autovacuum_vacuum_scale_factor, autovacuum_vacuum_threshold)"
    )
  end
end

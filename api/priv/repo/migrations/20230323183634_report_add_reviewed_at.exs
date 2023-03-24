defmodule Flirtual.Repo.Migrations.ReportAddReviewedAt do
  use Ecto.Migration

  def change do
    alter table(:reports) do
      add :reviewed_at, :naive_datetime
    end
  end
end

defmodule Flirtual.Repo.Migrations.AddReportImages do
  use Ecto.Migration

  def change do
    alter table(:reports) do
      add(:images, {:array, :string}, default: [])
    end
  end
end

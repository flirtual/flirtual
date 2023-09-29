defmodule Flirtual.Repo.Migrations.AddProfileColors do
  use Ecto.Migration

  def change do
    alter table(:profiles) do
      add(:color_1, :string)
      add(:color_2, :string)
    end
  end
end

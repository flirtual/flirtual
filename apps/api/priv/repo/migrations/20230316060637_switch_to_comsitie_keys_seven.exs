defmodule Flirtual.Repo.Migrations.SwitchToComsitieKeysSeven do
  use Ecto.Migration

  def change do
    alter table(:profiles) do
      add :openness, :float
      add :conscientiousness, :float
      add :agreeableness, :float
    end
  end
end

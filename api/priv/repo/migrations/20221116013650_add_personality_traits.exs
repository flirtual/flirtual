defmodule Flirtual.Repo.Migrations.AddPersonalityTraits do
  use Ecto.Migration

  def change do
    alter table(:user_profiles) do
      add :openness, :integer, default: 0
      add :conscientiousness, :integer, default: 0
      add :agreeableness, :integer, default: 0
    end
  end
end

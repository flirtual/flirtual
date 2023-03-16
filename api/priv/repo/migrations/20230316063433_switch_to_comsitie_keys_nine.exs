defmodule Flirtual.Repo.Migrations.SwitchToComsitieKeysNine do
  use Ecto.Migration

  def change do
    alter table(:profiles) do
      modify :openness, :integer
      modify :conscientiousness, :integer
      modify :agreeableness, :integer
    end

    alter table(:profile_custom_weights) do
      modify :country, :float, null: false, default: 1.0
      modify :monopoly, :float, null: false, default: 1.0
      modify :games, :float, null: false, default: 1.0
      modify :default_interests, :float, null: false, default: 1.0
      modify :custom_interests, :float, null: false, default: 1.0
      modify :personality, :float, null: false, default: 1.0
      modify :serious, :float, null: false, default: 1.0
      modify :domsub, :float, null: false, default: 1.0
      modify :kinks, :float, null: false, default: 1.0
      modify :likes, :float, null: false, default: 1.0
    end
  end
end

defmodule Flirtual.Repo.Migrations.AddUserRatingPrompts do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add(:rating_prompts, :integer, default: 0)
    end
  end
end

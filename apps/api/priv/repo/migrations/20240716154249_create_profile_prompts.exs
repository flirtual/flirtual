defmodule Flirtual.Repo.Migrations.CreateProfilePrompts do
  use Ecto.Migration

  def change do
    create table(:profile_prompts, primary_key: false) do
      add(:profile_id, references(:profiles, type: :uuid, column: :user_id, on_delete: :delete_all), null: false, primary_key: true)
      add(:prompt_id, references(:attributes, type: :uuid, on_delete: :delete_all), null: false, primary_key: true)
      add(:response, :text, null: false)
      add(:order, :integer, null: false)
    end

    create unique_index(:profile_prompts, [:profile_id, :prompt_id])
  end
end

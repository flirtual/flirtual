defmodule Flirtual.Repo.Migrations.SwitchSeriousToRelationships do
  use Ecto.Migration

  def change do
    alter table(:profiles) do
      add(:relationships, {:array, :citext}, null: false, default: [])
    end

    flush()

    execute("""
      update profiles
      set relationships = array_append(relationships, 'serious')
      where serious = true
    """)

    alter table(:profiles) do
      remove(:serious)
    end

    rename(table(:profile_custom_weights), :serious, to: :relationships)
  end
end

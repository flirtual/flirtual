defmodule Flirtual.Repo.Migrations.AttributeTranslations do
  use Ecto.Migration

  def change do
    alter table(:attributes) do
      remove :name
    end

    execute("""
    UPDATE attributes
    SET metadata = metadata - 'definition' - 'plural' - 'details'
    WHERE metadata ? 'definition' OR metadata ? 'plural' OR metadata ? 'details';
    """)

    # Set the metadata to NULL if it's an empty object after the removal
    execute("""
    UPDATE attributes
    SET metadata = NULL
    WHERE metadata = '{}';
    """)
  end
end

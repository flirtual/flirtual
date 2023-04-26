defmodule Flirtual.Repo.Migrations.AddAttributeOrder do
  use Ecto.Migration

  def change do
    alter table(:attributes) do
      add :order, :integer
    end

    flush()

    # Update the "order" column with the value from metadata
    execute("""
    UPDATE attributes
    SET "order" = (metadata->>'order')::integer
    WHERE metadata ? 'order'
    """)

    # Remove "order" key from the metadata column
    execute("""
    UPDATE attributes
    SET metadata = metadata - 'order'
    WHERE metadata ? 'order'
    """)
  end
end

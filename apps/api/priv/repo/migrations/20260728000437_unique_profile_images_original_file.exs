defmodule Flirtual.Repo.Migrations.UniqueProfileImagesOriginalFile do
  use Ecto.Migration

  def change do
    # Resolve duplicate references to one row per original_file: keep the
    # attached row, else the moderation-retained row (suspended_url), else the
    # newest; never delete retained rows.
    execute("""
    DELETE FROM profile_images p
    USING (
      SELECT id, row_number() OVER (
        PARTITION BY original_file
        ORDER BY (profile_id IS NOT NULL) DESC,
                 (suspended_url IS NOT NULL) DESC,
                 created_at DESC,
                 id DESC
      ) AS rn
      FROM profile_images
    ) ranked
    WHERE p.id = ranked.id AND ranked.rn > 1 AND p.suspended_url IS NULL
    """)

    drop_if_exists index(:profile_images, [:original_file])
    create unique_index(:profile_images, [:original_file])
  end
end

defmodule Flirtual.Repo.Migrations.UpdatePronounMetadataOrder do
  use Ecto.Migration

  # Pronouns no longer alias Woman/Man/Other for matchmaking, and move to the end
  # of the list.
  def up do
    execute("""
    UPDATE attributes
    SET metadata = (coalesce(attributes.metadata, '{}'::jsonb) - 'alias_of')
                   || '{"pronoun": true}'::jsonb,
        "order" = last_gender."order" + pronoun.sort
    FROM (SELECT max("order") AS "order" FROM attributes WHERE type = 'gender') AS last_gender,
         (VALUES
           ('b189a042-5597-4790-a723-728eefb9f01b'::uuid, 1), -- She/Her
           ('584ddcf8-32b3-45d4-ba32-50b825d519f8'::uuid, 2), -- He/Him
           ('c2b2c04f-2542-49a6-aac9-d6b67d5e48eb'::uuid, 3)  -- They/Them
         ) AS pronoun(id, sort)
    WHERE attributes.id = pronoun.id
    """)
  end
end

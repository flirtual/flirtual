defmodule Flirtual.Repo.Migrations.AddDobLockedTag do
  use Ecto.Migration

  def change do
    execute("""
     UPDATE users
     SET tags = array_append(tags, 'dob_locked')
     WHERE id IN (
       SELECT DISTINCT user_id FROM logins
       WHERE ip_region = 'Texas, US'
       AND user_id IS NOT NULL
     )
     AND NOT tags @> ARRAY['dob_locked']::citext[]
    """)
  end
end

defmodule Flirtual.Repo.Migrations.MoveHrvToHbs do
  use Ecto.Migration

  # hrv was labelled Serbo-Croatian but is the ISO 639-3 code for Croatian; people who picked it
  # meant Serbo-Croatian, which is hbs.
  def up do
    %{rows: rows} =
      repo().query!("""
      UPDATE profiles
      SET languages =
        CASE WHEN 'hbs' = ANY(languages)
          THEN array_remove(languages, 'hrv')
          ELSE array_replace(languages, 'hrv', 'hbs')
        END
      WHERE 'hrv' = ANY(languages)
      RETURNING user_id
      """)

    execute("""
    DELETE FROM profile_advanced_filters AS legacy
    USING profile_advanced_filters AS current
    WHERE legacy.category = 'language' AND legacy.value = 'hrv'
      AND current.profile_id = legacy.profile_id AND current.kind = legacy.kind
      AND current.category = 'language' AND current.value = 'hbs'
    """)

    execute(
      "UPDATE profile_advanced_filters SET value = 'hbs' WHERE category = 'language' AND value = 'hrv'"
    )

    user_ids = Enum.map(rows, fn [id] -> Ecto.UUID.load!(id) end)

    if user_ids != [] do
      repo().insert!(Flirtual.ObanWorkers.SearchIndex.new(%{"user_ids" => user_ids}))
    end
  end
end

defmodule Flirtual.Repo.Migrations.DismissTourAddHomieModeNews do
  use Ecto.Migration

  # Dismiss the tour (now stored in the database) for users who have seen it
  # within the past year, and show them the Homie Mode news item.
  def up do
    execute """
    UPDATE preferences
    SET dismissed = dismissed || '{tour_browsing}'
    FROM users
    WHERE users.id = preferences.user_id
      AND users.active_at >= now() - interval '1 year'
      AND NOT dismissed @> '{tour_browsing}'
      AND EXISTS (
        SELECT 1 FROM likes_and_passes
        WHERE likes_and_passes.profile_id = users.id
      )
    """

    execute """
    UPDATE users
    SET news = array_append(news, '2026_homie_mode')
    WHERE users.active_at >= now() - interval '1 year'
      AND NOT news @> '{2026_homie_mode}'
      AND EXISTS (
        SELECT 1 FROM likes_and_passes
        WHERE likes_and_passes.profile_id = users.id
      )
    """
  end
end

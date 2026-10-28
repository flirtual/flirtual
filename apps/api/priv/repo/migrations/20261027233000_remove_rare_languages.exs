defmodule Flirtual.Repo.Migrations.RemoveRareLanguages do
  use Ecto.Migration

  @removed ~w(ae cu ia ie pi sa syc vo)

  def up do
    %{rows: rows} =
      repo().query!(
        """
        UPDATE profiles
        SET languages = ARRAY(SELECT l FROM unnest(languages) AS l WHERE l <> ALL($1::citext[]))
        WHERE languages && $1::citext[]
        RETURNING user_id
        """,
        [@removed]
      )

    repo().query!(
      "DELETE FROM profile_advanced_filters WHERE category = 'language' AND value = ANY($1)",
      [@removed]
    )

    user_ids = Enum.map(rows, fn [id] -> Ecto.UUID.load!(id) end)

    if user_ids != [] do
      repo().insert!(Flirtual.ObanWorkers.SearchIndex.new(%{"user_ids" => user_ids}))
    end
  end
end

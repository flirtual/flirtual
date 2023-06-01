defmodule Flirtual.Repo.Migrations.AddLikesAndPassesOpposite do
  use Ecto.Migration

  def change do
    execute "TRUNCATE likes_and_passes CASCADE"

    alter table(:likes_and_passes) do
      add :opposite_id,
          references(:likes_and_passes,
            type: :uuid,
            on_delete: :nilify_all,
            match: :full
          )
    end
  end
end

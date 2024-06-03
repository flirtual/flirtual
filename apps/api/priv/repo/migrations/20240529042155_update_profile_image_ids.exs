defmodule Flirtual.Repo.Migrations.UpdateProfileImageIds do
  use Ecto.Migration

  def change do
    rename table(:profile_images), :external_id, to: :original_file

    alter table(:profile_images) do
      add :external_id, :text
      add :blur_id, :text

      modify :profile_id,
             references(:profiles,
               type: :uuid,
               on_delete: :delete_all,
               column: :user_id,
               match: :full
             ),
             null: true,
             from:
               references(:profiles,
                 type: :uuid,
                 on_delete: :delete_all,
                 column: :user_id,
                 match: :full
               )
    end
  end
end

defmodule Flirtual.Repo.Migrations.SwitchToComsitieKeysFive do
  use Ecto.Migration

  def change do
    drop table(:profile_images), mode: :cascade

    create table(:profile_images, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false

      add :profile_id,
          references(:profiles,
            type: :uuid,
            on_delete: :delete_all,
            column: :user_id,
            match: :full
          ),
          null: false

      add :external_id, :text, null: false
      add :scanned, :boolean, null: false, default: false
      add :order, :integer

      timestamps(inserted_at: :created_at)
    end
  end
end

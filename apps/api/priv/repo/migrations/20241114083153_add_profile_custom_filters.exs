defmodule Flirtual.Repo.Migrations.AddProfileCustomFilters do
  use Ecto.Migration

  def change do
    create table(:profile_custom_filters, primary_key: false) do
      add(
        :profile_id,
        references(:profiles, type: :uuid, column: :user_id, on_delete: :delete_all),
        null: false,
        primary_key: true
      )

      add(:preferred, :boolean, null: false)
      add(:type, :text, null: false, primary_key: true)
      add(:value, :text, null: false, primary_key: true)
    end
  end
end

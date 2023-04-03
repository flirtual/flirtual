defmodule Flirtual.Repo.Migrations.MakeDatesConsistant do
  use Ecto.Migration

  def change do
    [
      :attributes,
      :profiles
    ]
    |> Enum.each(fn table_name ->
      alter table(table_name) do
        modify :updated_at, :utc_datetime
      end
    end)

    alter table(:blocks) do
      modify :created_at, :utc_datetime
    end

    [
      :connections,
      :likes_and_passes,
      :profile_images,
      :prospects,
      :reports,
      :sessions,
      :subscriptions,
      :users
    ]
    |> Enum.each(fn table_name ->
      alter table(table_name) do
        modify :created_at, :utc_datetime
        modify :updated_at, :utc_datetime
      end
    end)

    alter table(:sessions) do
      modify :expire_at, :utc_datetime
    end

    alter table(:users) do
      [
        :born_at,
        :email_confirmed_at,
        :deactivated_at,
        :banned_at,
        :shadowbanned_at,
        :incognito_at,
        :active_at
      ]
      |> Enum.each(fn field_name ->
        modify field_name, :utc_datetime
      end)
    end

    alter table(:subscriptions) do
      modify :cancelled_at, :utc_datetime
    end
  end
end

defmodule Flirtual.Repo.Migrations.AddUserIndefShadowbannedAt do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add(:indef_shadowbanned_at, :utc_datetime)
    end
  end
end

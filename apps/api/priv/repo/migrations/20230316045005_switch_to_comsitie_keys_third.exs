defmodule Flirtual.Repo.Migrations.SwitchToComsitieKeysThird do
  use Ecto.Migration

  def change do
    alter table(:user_change_queue, primary_key: false) do
      remove :type
      remove :updated_at
    end
  end
end

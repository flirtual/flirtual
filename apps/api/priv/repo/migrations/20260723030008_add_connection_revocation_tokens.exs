defmodule Flirtual.Repo.Migrations.AddConnectionRevocationTokens do
  use Ecto.Migration

  def change do
    alter table(:connections) do
      add :access_token, :text
      add :refresh_token, :text
    end
  end
end

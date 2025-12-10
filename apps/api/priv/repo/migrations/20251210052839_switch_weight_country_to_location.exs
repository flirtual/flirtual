defmodule Flirtual.Repo.Migrations.SwitchWeightCountryToLocation do
  use Ecto.Migration

  def change do
    rename table(:profile_custom_weights), :country, to: :location
  end
end

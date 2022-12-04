defmodule Flirtual.Repo.Migrations.AddPersonalityQuestions do
  use Ecto.Migration

  def change do
    alter table(:user_profiles) do
      add :question0, :boolean
      add :question1, :boolean
      add :question2, :boolean
      add :question3, :boolean
      add :question4, :boolean
      add :question5, :boolean
      add :question6, :boolean
      add :question7, :boolean
      add :question8, :boolean
    end
  end
end

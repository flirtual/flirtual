defmodule Flirtual.Repo.Migrations.SwitchModeratorMessageNoteToText do
  use Ecto.Migration

  def change do
    alter table(:users) do
      modify(:moderator_message, :text)
      modify(:moderator_note, :text)
    end
  end
end

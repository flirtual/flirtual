defmodule Flirtual.User.PreferencesTest do
  use ExUnit.Case, async: true

  alias Flirtual.User.Preferences

  describe "update_changeset/2" do
    test "accepts a shipped locale that isn't enabled yet" do
      assert Preferences.update_changeset(%Preferences{}, %{language: "ja"}).valid?
    end

    test "refuses a locale the app doesn't ship" do
      refute Preferences.update_changeset(%Preferences{}, %{language: "zz"}).valid?
    end
  end
end

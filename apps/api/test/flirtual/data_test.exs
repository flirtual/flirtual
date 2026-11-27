defmodule Flirtual.DataTest do
  use ExUnit.Case, async: true
  alias Flirtual.Data.{BanReason, Gender, Plan, Relationship}
  test "builds each entry as a struct with every field the file uses" do
    assert %Gender{
             id: "agender",
             alias_of: "other",
             pronoun: nil,
             simple: nil
           } = Gender.get("agender")

    assert Gender.get("2222222222222222222222") == nil
  end

  test "lists a file's entries, codes as they are" do
    assert Relationship.all() |> Enum.map(& &1.id) |> Enum.sort() ==
             ["friends", "hookups", "serious", "vr"]
  end

  describe "get/2" do
    test "gives an entry its text in the requested locale" do
      assert %Gender{name: "Frau"} = Gender.get("woman", "de")
      assert Gender.get("cis_man", "de").definition =~ ~r/^Ein Mann/
    end

    test "falls back to the default locale's text where a locale has none" do
      assert %Gender{name: "Woman"} = Gender.get("woman", "zz")
      assert BanReason.get("spam").details =~ ~r/^Spam profile\. /
    end

    test "works for any file, not only one kind" do
      assert %Plan{name: "Premium (alle 6 Monate)"} = Plan.get("six_months", "de")
    end

    test "is nil for an id the file doesn't have" do
      assert BanReason.get("woman", "de") == nil
    end
  end
end

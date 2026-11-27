defmodule FlirtualWeb.DataJSONTest do
  use ExUnit.Case, async: true
  alias FlirtualWeb.DataJSON
  alias Flirtual.Data.{Country, Game, Gender}

  test "sends clients every field an entry sets, its text included" do
    assert DataJSON.metadata(Gender.get("agender")) == %{
             alias_of: "other",
             definition: "Someone who does not identify with or experience any gender.",
             definition_link: "https://nonbinary.wiki/wiki/Agender",
             name: "Agender"
           }
  end

  test "keeps server-only fields out, and always sends the id" do
    game = %Game{id: "game", pcvr: "url", internal: %{"curated" => 1}}

    assert DataJSON.entry(game) == %{pcvr: "url", id: "game"}
    assert DataJSON.entry(Country.get("ca")) == %{id: "ca"}
  end

  test "adds every text field in the requested locale, English where it has none" do
    assert %{id: "woman", name: "Frau"} = DataJSON.entry(Gender.get("woman"), "de")
    assert %{definition: "Ein Mann" <> _} = DataJSON.entry(Gender.get("cis_man"), "de")
    assert %{name: "Woman"} = DataJSON.entry(Gender.get("woman"), "zz")
  end
end

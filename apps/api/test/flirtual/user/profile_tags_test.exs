defmodule Flirtual.User.ProfileTagsTest do
  use ExUnit.Case, async: true
  alias Flirtual.User.Profile
  alias Flirtual.Data.{Gender, Kink}

  test "an alias counts as the gender it aliases, and the rest stay" do
    woman = Gender.get("woman")
    agender = Gender.get("agender")
    nonbinary = Gender.get("other")

    assert Profile.normalize_aliases([woman, agender]) == [woman, nonbinary]
  end

  test "a kink counts as its pair" do
    [kink | _] = Enum.filter(Kink.all(), &(&1.pair && &1.pair != &1.id))

    assert Profile.normalize_pairs([kink]) == [Kink.get(kink.pair)]
  end

  test "a tag without an alias is left alone" do
    woman = Gender.get("woman")

    assert Profile.normalize_pairs([woman]) == [woman]
  end
end

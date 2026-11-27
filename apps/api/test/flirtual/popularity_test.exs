defmodule Flirtual.PopularityTest do
  use ExUnit.Case, async: false

  alias Flirtual.Data.Game
  alias Flirtual.Popularity
  alias Flirtual.Repo

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
    :ets.delete(:popularity, Game)
    :ok
  end

  test "scores nothing before the first refresh" do
    assert Popularity.scores() == %{}
  end

  test "scores every game, and games people picked above ones nobody did" do
    {:ok, user} =
      Oban.Testing.with_testing_mode(:manual, fn ->
        Flirtual.Faker.create_user(images: {:new, []})
      end)

    picked = Flirtual.User.get(user.id).profile.games |> Enum.map(& &1.id)
    [unpicked | _] = Game.all() |> Enum.map(& &1.id) |> Kernel.--(picked)

    # Only visible profiles count.
    Repo.query!("update users set status = 'visible' where id = $1", [
      user.id |> ShortUUID.decode!() |> Ecto.UUID.dump!()
    ])

    assert :ok = Popularity.update()
    scores = Popularity.scores()

    assert Map.keys(scores) |> Enum.sort() == Game.all() |> Enum.map(& &1.id) |> Enum.sort()
    assert picked != [] and Enum.all?(picked, &(scores[&1] > scores[unpicked]))
  end
end

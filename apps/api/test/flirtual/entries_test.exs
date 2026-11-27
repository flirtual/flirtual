defmodule Flirtual.EntriesTest do
  use ExUnit.Case, async: false

  import Ecto.Changeset
  alias Flirtual.Repo
  alias Flirtual.User.Profile
  alias Flirtual.Data.{Gender, Interest, Kink}

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)

    {:ok, user} =
      Oban.Testing.with_testing_mode(:manual, fn ->
        Flirtual.Faker.create_user(images: {:new, []})
      end)

    %{profile_id: user.id}
  end

  defp entries(module, count), do: module.all() |> Enum.take(count)

  defp reload(profile_id), do: Repo.get!(Profile, profile_id)

  test "entries survive a round trip, in display order", %{profile_id: profile_id} do
    [first, second] = entries(Interest, 2)

    reload(profile_id)
    |> change(interests: [second, first])
    |> Repo.update!()

    assert Enum.map(reload(profile_id).interests, & &1.id) == [first.id, second.id]
  end

  test "entries can be set by id", %{profile_id: profile_id} do
    [gender] = entries(Gender, 1)

    reload(profile_id)
    |> cast(%{genders: [gender.id]}, [:genders])
    |> Repo.update!()

    assert [%Gender{id: id}] = reload(profile_id).genders
    assert id == gender.id
  end

  test "an id the data doesn't have is dropped when loaded", %{profile_id: profile_id} do
    [gender] = entries(Gender, 1)

    Repo.query!(
      "update profiles set genders = array[$1, 'gone'] where user_id = $2",
      [gender.id, profile_id |> ShortUUID.decode!() |> Ecto.UUID.dump!()]
    )

    assert Enum.map(reload(profile_id).genders, & &1.id) == [gender.id]
  end

  test "an id of another type, or of none, is refused when cast", %{profile_id: profile_id} do
    [kink] = entries(Kink, 1)

    for id <- [kink.id, "2222222222222222222222"] do
      refute (reload(profile_id) |> cast(%{genders: [id]}, [:genders])).valid?
    end
  end

  test "preferences take their genders by id, at least one and at most three", %{profile_id: profile_id} do
    [gender] = entries(Gender, 1)
    preferences = Repo.get!(Profile.Preferences, profile_id)

    changeset = Profile.Preferences.changeset(preferences, %{"genders" => [gender.id]})
    assert Enum.map(get_field(changeset, :genders), & &1.id) == [gender.id]

    refute Profile.Preferences.changeset(preferences, %{"genders" => []}).valid?
    refute Profile.Preferences.changeset(preferences, %{"genders" => Enum.map(entries(Gender, 4), & &1.id)}).valid?
  end
end

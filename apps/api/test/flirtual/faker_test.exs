defmodule Flirtual.FakerTest do
  use ExUnit.Case, async: false
  use Oban.Testing, repo: Flirtual.Repo

  alias Flirtual.Repo
  alias Flirtual.User

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
  end

  defp create_user do
    Oban.Testing.with_testing_mode(:manual, fn ->
      {:ok, user} = Flirtual.Faker.create_user(images: {:new, []})
      Repo.preload(User.get(user.id), preferences: [:email_notifications])
    end)
  end

  test "a fake user is created where leaked passwords are refused" do
    assert Application.get_env(:flirtual, :prohibit_leaked_passwords, true)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, %User{}} = Flirtual.Faker.create_user(images: {:new, []})
    end)
  end
end

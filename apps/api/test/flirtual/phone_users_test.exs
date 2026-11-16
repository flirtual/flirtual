defmodule Flirtual.PhoneUsersTest do
  use ExUnit.Case, async: false

  alias Flirtual.{Repo, User, Users}

  @phone "+447400123456"

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
    Ecto.Adapters.SQL.Sandbox.mode(Repo, {:shared, self()})
    :ok
  end

  test "a phone sign-up creates an account with a confirmed number and no email" do
    {:ok, %User{} = user} = Users.create_from_phone(@phone)

    assert user.phone_number == @phone
    assert %DateTime{} = user.phone_confirmed_at
    assert user.email == nil
    assert user.email_confirmed_at == nil
  end

  test "an account is found by its number" do
    {:ok, user} = Users.create_from_phone(@phone)

    assert %User{id: id} = Users.get_by_phone(@phone)
    assert id == user.id
    assert Users.get_by_phone("+447400999999") == nil
  end

  test "a number can't be registered twice" do
    {:ok, _} = Users.create_from_phone(@phone)

    assert {:error, %Ecto.Changeset{errors: errors}} = Users.create_from_phone(@phone)
    assert {_, [constraint: :unique, constraint_name: "users_phone_number_index"]} = errors[:phone_number]
  end
end

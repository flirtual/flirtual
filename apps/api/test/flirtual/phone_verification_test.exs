defmodule Flirtual.PhoneVerificationTest do
  use ExUnit.Case, async: false

  import Ecto.Query

  alias Flirtual.{PhoneVerification, Repo}

  @phone "+447400123456"

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
    ExRated.delete_bucket("phone_verify:#{@phone}")
    :ok
  end

  test "a sent code verifies once" do
    {:ok, code} = PhoneVerification.create(@phone)

    assert PhoneVerification.verify(@phone, code) == :ok
    assert PhoneVerification.verify(@phone, code) == {:error, :verification_invalid_code}
  end

  test "a wrong code is refused" do
    {:ok, code} = PhoneVerification.create(@phone)
    wrong = if code == "482913", do: "482914", else: "482913"

    assert PhoneVerification.verify(@phone, wrong) == {:error, :verification_invalid_code}
  end

  test "an expired code is refused" do
    {:ok, code} = PhoneVerification.create(@phone)

    Repo.update_all(
      from(verification in PhoneVerification, where: verification.phone_number == ^@phone),
      set: [created_at: DateTime.add(DateTime.utc_now(), -16, :minute)]
    )

    assert PhoneVerification.verify(@phone, code) == {:error, :verification_invalid_code}
  end

  test "a new code replaces the previous one" do
    {:ok, first} = PhoneVerification.create(@phone)
    {:ok, second} = PhoneVerification.create(@phone)

    if first != second,
      do: assert(PhoneVerification.verify(@phone, first) == {:error, :verification_invalid_code})

    assert PhoneVerification.verify(@phone, second) == :ok
  end

  test "guessing is rate limited per number" do
    {:ok, code} = PhoneVerification.create(@phone)
    wrong = if code == "482913", do: "482914", else: "482913"

    for _ <- 1..10, do: PhoneVerification.verify(@phone, wrong)

    assert PhoneVerification.verify(@phone, code) == {:error, :verification_rate_limit}
  end
end

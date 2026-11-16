defmodule Flirtual.ContactConfirmedTest do
  use ExUnit.Case, async: true

  alias Flirtual.User

  @now ~U[2026-11-16 00:00:00Z]

  test "a confirmed phone confirms an account without email" do
    assert User.contact_confirmed?(%User{email: nil, phone_confirmed_at: @now})
  end

  test "a confirmed email confirms an account" do
    assert User.contact_confirmed?(%User{email: "a@example.com", email_confirmed_at: @now})
  end

  test "an unconfirmed email and no phone leave it unconfirmed" do
    refute User.contact_confirmed?(%User{email: "a@example.com"})
  end

  test "an account with neither is unconfirmed" do
    refute User.contact_confirmed?(%User{})
  end
end

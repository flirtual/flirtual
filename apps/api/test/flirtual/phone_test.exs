defmodule Flirtual.PhoneTest do
  use ExUnit.Case, async: true

  alias Flirtual.Phone

  test "normalizes an international mobile number to E.164" do
    assert Phone.parse("+44 7400 123456") == {:ok, "+447400123456"}
  end

  test "accepts a North American number, which may be mobile" do
    assert Phone.parse("+1 (202) 456-1111") == {:ok, "+12024561111"}
  end

  test "rejects a number without its country code" do
    assert Phone.parse("202-456-1111") == {:error, :phone_invalid}
  end

  test "rejects a number too short to be valid" do
    assert Phone.parse("+1 555") == {:error, :phone_invalid}
  end

  test "rejects a landline, which can't receive SMS" do
    assert Phone.parse("+44 20 7946 0958") == {:error, :phone_not_mobile}
  end

  test "rejects input that isn't a string" do
    assert Phone.parse(nil) == {:error, :phone_invalid}
  end
end

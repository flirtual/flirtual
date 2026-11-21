defmodule Flirtual.PhoneAppealTest do
  use ExUnit.Case, async: true

  alias Flirtual.Freshdesk

  @phone "+447400123456"

  test "a phone-only appeal names the requester by phone" do
    ticket =
      Freshdesk.ticket(%{
        subject: "Appeal",
        body: "Please",
        name: "Someone",
        email: nil,
        phone: @phone,
        custom_fields: %{}
      })

    assert ticket.phone == @phone
    refute Map.has_key?(ticket, :email)
  end

  test "an email appeal names the requester by email" do
    ticket =
      Freshdesk.ticket(%{
        subject: "Appeal",
        body: "Please",
        name: "Someone",
        email: "a@example.com",
        phone: nil,
        custom_fields: %{}
      })

    assert ticket.email == "a@example.com"
    refute Map.has_key?(ticket, :phone)
  end
end

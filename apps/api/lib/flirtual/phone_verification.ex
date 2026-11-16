defmodule Flirtual.PhoneVerification do
  use Flirtual.Schema, primary_key: false

  import Ecto.Query

  alias Flirtual.{PhoneVerification, Repo}

  @twelve_hours 43_200_000
  @code_expiry_minutes 15
  @unlucky_codes ~w(000000 111111 222222 333333 444444 555555 666666 777777 888888 999999 123456 123123)

  schema "phone_verifications" do
    field(:phone_number, :string, primary_key: true)
    field(:code, :string)
    timestamps(updated_at: false)
  end

  defp generate_code do
    code =
      :crypto.strong_rand_bytes(4)
      |> :binary.decode_unsigned()
      |> rem(1_000_000)
      |> Integer.to_string()
      |> String.pad_leading(6, "0")

    if code in @unlucky_codes, do: generate_code(), else: code
  end

  def create(phone_number) do
    code = generate_code()

    %PhoneVerification{phone_number: phone_number, code: code}
    |> Repo.insert(
      on_conflict: [set: [code: code, created_at: DateTime.utc_now()]],
      conflict_target: :phone_number
    )
    |> case do
      {:ok, _} -> {:ok, code}
      error -> error
    end
  end

  def verify(phone_number, code) when is_binary(phone_number) and is_binary(code) do
    expiry = DateTime.add(DateTime.utc_now(), -@code_expiry_minutes, :minute)

    with {:ok, _} <- ExRated.check_rate("phone_verify:#{phone_number}", @twelve_hours, 10),
         %PhoneVerification{code: stored_code} = verification <-
           PhoneVerification
           |> where([verification], verification.phone_number == ^phone_number)
           |> where([verification], verification.created_at >= ^expiry)
           |> Repo.one(),
         true <- Plug.Crypto.secure_compare(code, stored_code),
         {:ok, _} <- Repo.delete(verification) do
      :ok
    else
      {:error, _} -> {:error, :verification_rate_limit}
      _ -> {:error, :verification_invalid_code}
    end
  end

  def verify(_, _), do: {:error, :verification_invalid_code}
end

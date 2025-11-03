defmodule Flirtual.User.Verification do
  use Flirtual.Schema, primary_key: false

  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.{Repo, User, Users}
  alias Flirtual.User.{Login, Verification}

  @twelve_hours 43_200_000
  @code_expiry_minutes 15
  @unlucky_codes ~w(000000 111111 222222 333333 444444 555555 666666 777777 888888 999999 123456 123123)

  schema "verifications" do
    belongs_to(:login, Login, references: :id, primary_key: true)
    field(:code, :string)
    timestamps(updated_at: false)
  end

  def changeset(verification, attrs) do
    verification
    |> cast(attrs, [:login_id, :code])
    |> validate_required([:login_id, :code])
    |> validate_length(:code, is: 6)
    |> validate_format(:code, ~r/^\d{6}$/)
  end

  defp generate_code do
    code =
      (:rand.uniform(1_000_000) - 1)
      |> Integer.to_string()
      |> String.pad_leading(6, "0")

    if code in @unlucky_codes do
      generate_code()
    else
      code
    end
  end

  def create(login_id) do
    code = generate_code()

    %Verification{login_id: login_id}
    |> changeset(%{login_id: login_id, code: code})
    |> Repo.insert(
      on_conflict: [set: [code: code, created_at: DateTime.utc_now()]],
      conflict_target: :login_id
    )
  end

  def get(login_id) do
    expiry = DateTime.utc_now() |> DateTime.add(-@code_expiry_minutes, :minute)

    Verification
    |> where([verification], verification.login_id == ^login_id)
    |> where([verification], verification.created_at >= ^expiry)
    |> Repo.one()
  end

  def send_verification(conn, user, device_id) do
    with {:ok, _} <-
           ExRated.check_rate("send_verification:#{user.id}", @twelve_hours, 10),
         {:ok, login} <-
           Login.log_login_attempt(conn, user.id, nil, device_id, needs_verification: true),
         {:ok, verification} <- create(login.id),
         {:ok, _} <- User.Email.deliver(user, :verification_code, verification.code) do
      login.id
    else
      {:error, _} -> {:error, :verification_rate_limit}
      error -> error
    end
  end

  def resend_verification(login_id) do
    with %Login{user_id: user_id} <- Login.get(login_id),
         {:ok, _} <-
           ExRated.check_rate("send_verification:#{user_id}", @twelve_hours, 10),
         %User{} = user <- Users.get(user_id),
         {:ok, verification} <- create(login_id),
         {:ok, _} <- User.Email.deliver(user, :verification_code, verification.code) do
      {:ok, login_id}
    else
      nil -> {:error, :verification_invalid_code}
      {:error, _} -> {:error, :verification_rate_limit}
      error -> error
    end
  end

  def verify(login_id, code) when is_binary(code) do
    with %Login{user_id: user_id} <- Login.get(login_id),
         {:ok, _} <- ExRated.check_rate("verify:#{user_id}", @twelve_hours, 10),
         %Verification{code: ^code} <- get(login_id) do
      :ok
    else
      nil -> {:error, :verification_invalid_code}
      %Verification{} -> {:error, :verification_invalid_code}
      {:error, _} -> {:error, :verification_rate_limit}
      error -> error
    end
  end

  def verify(_, _), do: {:error, :verification_invalid_code}
end

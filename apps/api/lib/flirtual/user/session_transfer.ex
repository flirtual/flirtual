defmodule Flirtual.User.SessionTransfer do
  use Flirtual.Schema

  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.Repo
  alias Flirtual.User.{Session, SessionTransfer}

  schema "session_transfers" do
    belongs_to(:session, Session)

    field(:token, :string, virtual: true, redact: true)
    field(:hashed_token, :binary, redact: true)
    field(:expire_at, :utc_datetime)

    timestamps(updated_at: false, inserted_at: :created_at)
  end

  def default_assoc(), do: [session: [:user]]

  @lifetime_in_seconds 60

  def create(%Session{} = session) do
    raw_token = Session.new_token()

    %SessionTransfer{}
    |> change(%{
      session_id: session.id,
      hashed_token: Session.hash_token(raw_token),
      expire_at:
        DateTime.utc_now()
        |> DateTime.add(@lifetime_in_seconds, :second)
        |> DateTime.truncate(:second)
    })
    |> Repo.insert()
    |> case do
      {:ok, transfer} -> {:ok, %{transfer | token: Session.encode_token(raw_token)}}
      {:error, reason} -> {:error, reason}
    end
  end

  # The row is deleted on use. Returns the session it pointed at, or nil when the
  # token is unknown, spent, or expired.
  def consume(encoded_token) when is_binary(encoded_token) do
    with {:ok, raw_token} <- Base.url_decode64(encoded_token, padding: false),
         {1, [%SessionTransfer{} = transfer]} <-
           SessionTransfer
           |> where(hashed_token: ^Session.hash_token(raw_token))
           |> where([transfer], transfer.expire_at > ^DateTime.utc_now())
           |> select([transfer], transfer)
           |> Repo.delete_all() do
      transfer
      |> Repo.preload(SessionTransfer.default_assoc())
      |> Map.get(:session)
    else
      _ -> nil
    end
  end

  def delete_expired() do
    SessionTransfer
    |> where([transfer], transfer.expire_at <= ^DateTime.utc_now())
    |> Repo.delete_all()
  end
end

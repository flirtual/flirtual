defmodule Flirtual.User.Session do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.User.Session.Policy

  import Ecto.Query
  import Ecto.Changeset
  import Flirtual.Utilities.Changeset

  alias Flirtual.User.ChangeQueue
  alias Flirtual.Repo
  alias Flirtual.User
  alias Flirtual.User.Session

  schema "sessions" do
    belongs_to :user, User
    belongs_to :sudoer, User

    field :token, :string, virtual: true, redact: true
    field :hashed_token, :string, redact: true

    timestamps(inserted_at: :created_at)
  end

  def default_assoc do
    [
      user: User.default_assoc()
    ]
  end

  @hash_algorithm :sha256
  @rand_size 32

  def create(%User{} = user) do
    raw_token = new_token()

    %Session{
      hashed_token: hash_token(raw_token),
      token: encode_token(raw_token),
      user_id: user.id
    }
    |> Repo.insert!()
    |> Repo.preload(Session.default_assoc())
  end

  def sudo(%Session{} = session, %User{} = user) do
    cast(
      session,
      %{
        sudoer_id: session.sudoer_id || session.user_id,
        user_id: user.id
      },
      [:sudoer_id, :user_id]
    )
    |> validate_uuid(:sudoer_id)
    |> validate_uuid(:user_id)
    |> then(
      &if(get_field(&1, :user_id) === get_field(&1, :sudoer_id)) do
        add_error(&1, :user_id, "cannot sudo yourself")
      else
        &1
      end
    )
    |> Repo.update()
  end

  def sudo(%Session{sudoer_id: sudoer_id} = session, nil) when is_binary(sudoer_id) do
    change(
      session,
      %{
        sudoer_id: nil,
        user_id: sudoer_id
      }
    )
    |> Repo.update()
  end

  def sudo(%Session{} = session, nil) do
    session
  end

  def get(token: token) when is_binary(token) do
    Session |> query_token(token) |> one()
  end

  def get(user_id: user_id) when is_binary(user_id) do
    Session |> where(user_id: ^user_id) |> delete_all()
  end

  def delete(user_id: user_id) when is_binary(user_id) do
    Session |> where(user_id: ^user_id) |> delete_all()
  end

  def delete(token: token) when is_binary(token) do
    Session |> query_token(token) |> delete_all()
  end

  def one(query) do
    query
    |> preload(^Session.default_assoc())
    |> Repo.one()
  end

  def delete_all(query) do
    query
    |> Repo.delete_all()
  end

  def query_token(query, encoded_token) do
    hashed_token = Session.hash_token(Session.decode_token(encoded_token))
    query |> where(hashed_token: ^hashed_token)
  end

  @hour_in_seconds 3600

  def maybe_update_active_at(nil), do: nil

  def maybe_update_active_at(session) do
    now = NaiveDateTime.truncate(NaiveDateTime.utc_now(), :second)
    last_active_at = session.user.active_at

    if(
      not is_nil(last_active_at) and
        NaiveDateTime.compare(now, NaiveDateTime.add(last_active_at, @hour_in_seconds)) === :lt
    ) do
      {:ok, session}
    else
      Repo.transaction(fn ->
        with {:ok, user} <-
               session.user
               |> change(%{active_at: now})
               |> Repo.update(),
             {:ok, _} <- ChangeQueue.add(user.id) do
          Map.put(session, :user, user)
        else
          {:error, reason} -> Repo.rollback(reason)
          reason -> Repo.rollback(reason)
        end
      end)
    end
  end

  def new_token() do
    :crypto.strong_rand_bytes(@rand_size)
  end

  def encode_token(raw_token) do
    Base.url_encode64(raw_token, padding: false)
  end

  def decode_token(uri_token) do
    Base.url_decode64!(uri_token, padding: false)
  end

  def hash_token(token) do
    :crypto.hash(@hash_algorithm, token)
  end

  def compare_token(token, hashed_token) do
    hash_token(decode_token(token)) === hashed_token
  end
end

defmodule Flirtual.User.Session.Policy do
  use Flirtual.Policy

  alias Flirtual.User
  alias Flirtual.User.Session

  def authorize(
        :read,
        %Plug.Conn{
          assigns: %{
            session: %Session{
              id: id,
              user: %User{
                banned_at: nil
              }
            }
          }
        },
        %Session{
          id: id
        }
      ) do
    true
  end

  def authorize(_, _, _), do: false
end

defimpl Jason.Encoder, for: Flirtual.User.Session do
  def encode(value, opts) do
    Jason.Encode.map(
      Map.take(value, [
        :user,
        :sudoer_id,
        :updated_at,
        :created_at
      ])
      |> Map.filter(fn {_, value} -> value !== nil end),
      opts
    )
  end
end

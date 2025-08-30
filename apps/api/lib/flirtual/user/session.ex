defmodule Flirtual.User.Session do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.User.Session.Policy

  import Ecto.Query
  import Ecto.Changeset
  import Flirtual.Utilities.Changeset

  alias Flirtual.{ObanWorkers, Repo, User}
  alias Flirtual.User.Session

  schema "sessions" do
    belongs_to(:user, User)
    belongs_to(:sudoer, User)

    field(:token, :string, virtual: true, redact: true)
    field(:hashed_token, :string, redact: true)
    field(:expire_at, :utc_datetime)
    field(:platform, :string)

    timestamps()
  end

  def default_assoc do
    [
      user: User.default_assoc()
    ]
  end

  @forty_five_days_in_seconds 3_888_000
  @year_in_seconds 31_556_952

  def max_age(), do: @forty_five_days_in_seconds
  def max_age(:absolute), do: @year_in_seconds

  def new_expire_at() do
    DateTime.utc_now()
    |> DateTime.add(max_age(), :second)
    |> DateTime.truncate(:second)
  end

  @hash_algorithm :sha256
  @rand_size 32

  def create(%User{} = user, platform) do
    raw_token = new_token()

    %Session{
      hashed_token: hash_token(raw_token),
      token: encode_token(raw_token),
      user_id: user.id,
      expire_at: new_expire_at(),
      platform: platform
    }
    |> Repo.insert!()
    |> Repo.preload(Session.default_assoc())
  end

  def sudo(%Session{} = session, %User{} = user) do
    with {:ok, session} <-
           cast(
             session,
             %{
               sudoer_id: session.sudoer_id || session.user_id,
               user_id: user.id
             },
             [:sudoer_id, :user_id]
           )
           |> validate_uid(:sudoer_id)
           |> validate_uid(:user_id)
           |> then(
             &if(get_field(&1, :user_id) === get_field(&1, :sudoer_id)) do
               add_error(&1, :user_id, "cannot sudo yourself")
             else
               &1
             end
           )
           |> Repo.update(),
         session <- Repo.preload(session, Session.default_assoc()) do
      {:ok, session}
    end
  end

  def sudo(%Session{sudoer_id: sudoer_id} = session, nil) when is_binary(sudoer_id) do
    with {:ok, session} <-
           change(
             session,
             %{
               sudoer_id: nil,
               user_id: sudoer_id
             }
           )
           |> Repo.update(),
         session <- Repo.preload(session, Session.default_assoc()) do
      {:ok, session}
    end
  end

  def sudo(%Session{} = session, nil) do
    session
  end

  def get(token: token) when is_binary(token) do
    Session
    |> where_token(token)
    |> where_not_expired()
    |> preload(^Session.default_assoc())
    |> Repo.one()
  end

  def delete(user_id: user_id) when is_binary(user_id) do
    Session |> where(user_id: ^user_id) |> delete_all()
  end

  def delete(token: token) when is_binary(token) do
    Session |> where_token(token) |> delete_all()
  end

  def delete_others(user_id: user_id, token: token)
      when is_binary(user_id) and is_binary(token) do
    Session
    |> where(user_id: ^user_id)
    |> where_not_token(token)
    |> delete_all()
  end

  def delete_all(query) do
    query
    |> Repo.delete_all()
  end

  def where_token(query, encoded_token) do
    hashed_token = Session.hash_token(Session.decode_token(encoded_token))
    query |> where(hashed_token: ^hashed_token)
  end

  def where_not_token(query, encoded_token) do
    hashed_token = Session.hash_token(Session.decode_token(encoded_token))
    query |> where([session], session.hashed_token != ^hashed_token)
  end

  def where_not_expired(query) do
    now = DateTime.utc_now()
    absolute_expire_at = DateTime.add(now, -max_age(:absolute), :second)

    query
    |> where(
      [session],
      session.expire_at > ^now and session.created_at > ^absolute_expire_at
    )
  end

  @hour_in_seconds 3600

  def maybe_update_activity(nil), do: nil

  def maybe_update_activity(session) do
    now = DateTime.truncate(DateTime.utc_now(), :second)
    last_active_at = session.user.active_at

    # If the user was active in the last hour, don't update their last active at.
    # This is to prevent the user from being updated every time they make a request.
    if(
      (not is_nil(last_active_at) and
         DateTime.compare(now, DateTime.add(last_active_at, @hour_in_seconds)) === :lt) or
        not is_nil(session.sudoer_id)
    ) do
      {:ok, session}
    else
      Repo.transaction(fn ->
        with {:ok, user} <-
               session.user
               |> change(%{active_at: now})
               |> Repo.update(),
             {:ok, session} <-
               session
               |> change(%{expire_at: new_expire_at()})
               |> Repo.update(),
             {:ok, _} <- ObanWorkers.update_user(user.id, [:elasticsearch]) do
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

defimpl Jason.Encoder, for: Flirtual.User.Session do
  use Flirtual.Encoder,
    only: [
      :user,
      :sudoer_id,
      :updated_at,
      :created_at
    ]
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

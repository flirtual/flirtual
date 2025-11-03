defmodule Flirtual.User.Login do
  use Flirtual.Schema

  import Ecto.Changeset
  import Ecto.Query
  import FlirtualWeb.Utilities

  alias Flirtual.{Hash, Repo}
  alias Flirtual.User.{Login, Session}

  schema "logins" do
    belongs_to(:user, User)
    belongs_to(:session, Session)

    field(:status, :string)
    field(:method, :string)
    field(:ip_address, EctoNetwork.INET)
    field(:ip_region, :string)
    field(:device_id, :string)
    field(:platform, :string)

    timestamps(updated_at: false)
  end

  def changeset(login, attrs) do
    login
    |> cast(attrs, [
      :user_id,
      :session_id,
      :status,
      :method,
      :ip_address,
      :ip_region,
      :device_id,
      :platform
    ])
    |> validate_required([:status])
  end

  def create(attrs) do
    %Login{}
    |> changeset(attrs)
    |> Repo.insert()
  end

  def get(login_id) do
    Repo.get(Login, login_id)
  end

  def log_login_attempt(conn, user_id, session_id, opts \\ []) do
    ip_address = get_conn_ip(conn)
    ip_region = get_conn_region(conn)
    platform = get_conn_platform(conn)

    method = Keyword.get(opts, :method)
    method = if method, do: Atom.to_string(method), else: nil
    device_id = Keyword.get(opts, :device_id)

    status =
      cond do
        Keyword.get(opts, :needs_verification, false) -> "unverified"
        is_nil(session_id) -> "failed"
        true -> "successful"
      end

    Repo.transaction(fn ->
      with {:ok, login} <-
             create(%{
               user_id: user_id,
               session_id: session_id,
               status: status,
               method: method,
               ip_address: ip_address,
               ip_region: ip_region,
               device_id: device_id,
               platform: platform
             }),
           :ok <-
             if(status == "successful" and not is_nil(user_id),
               do: Hash.check_hash(user_id, "IP address", ip_address),
               else: :ok
             ),
           :ok <-
             if(status == "successful" and not is_nil(user_id),
               do: Hash.check_hash(user_id, "device ID", device_id),
               else: :ok
             ) do
        login
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def verify(login_id, session_id) do
    Login
    |> where([login], login.id == ^login_id)
    |> Repo.update_all(set: [status: "successful", session_id: session_id])
  end

  def untrust(user_id) do
    Login
    |> where([login], login.user_id == ^user_id)
    |> where([login], login.status == "successful")
    |> Repo.update_all(set: [status: "untrusted"])
  end

  def suspicious?(user_id, conn) do
    ip_address = get_conn_ip(conn)
    ip_region = get_conn_region(conn)

    trusted_login =
      Login
      |> where([login], login.user_id == ^user_id)
      |> where([login], login.status == "successful")
      |> then(fn query ->
        if ip_region in ["Unknown", "Tor", nil] do
          where(query, [login], login.ip_address == ^ip_address)
        else
          where(query, [login], login.ip_address == ^ip_address or login.ip_region == ^ip_region)
        end
      end)
      |> limit(1)
      |> Repo.exists?()

    not trusted_login
  end
end

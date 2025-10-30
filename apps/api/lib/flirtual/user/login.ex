defmodule Flirtual.User.Login do
  use Flirtual.Schema

  import Ecto.Changeset
  import FlirtualWeb.Utilities

  alias Flirtual.{Hash, Repo}
  alias Flirtual.User.{Login, Session}

  schema "logins" do
    belongs_to(:user, User)
    belongs_to(:session, Session)

    field(:status, :string)
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

  def log_login_attempt(conn, user_id, session_id, device_id) do
    ip_address = get_conn_ip(conn)
    ip_region = get_conn_region(conn)
    platform = get_conn_platform(conn)

    status = if(is_nil(session_id), do: "failed", else: "successful")

    Repo.transaction(fn ->
      with {:ok, login} <-
             create(%{
               user_id: user_id,
               session_id: session_id,
               status: status,
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
end

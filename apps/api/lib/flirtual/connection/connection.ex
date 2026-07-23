defmodule Flirtual.Connection do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.Connection.Policy

  import Ecto.Changeset
  import Ecto.Query

  require Flirtual.Utilities
  import Flirtual.Utilities

  alias Flirtual.Connection
  alias Flirtual.Repo
  alias Flirtual.User

  @providers %{
    google: Flirtual.Google,
    apple: Flirtual.Apple,
    meta: Flirtual.Meta,
    discord: Flirtual.Discord,
    vrchat: Flirtual.VRChat
  }

  @provider_labels %{
    google: "Google",
    apple: "Apple",
    meta: "Meta",
    discord: "Discord",
    vrchat: "VRChat"
  }

  @provider_types Map.keys(@providers)

  # Visible connections are shared with matches; the rest are auth-only.
  @visible_types [:discord, :vrchat, :meta]

  def visible?(type) when type in @provider_types, do: type in @visible_types

  schema "connections" do
    belongs_to(:user, User)

    field(:type, Ecto.Enum, values: @provider_types)
    field(:uid, :string)

    field(:display_name, :string)
    field(:avatar, :string)

    field(:access_token, :string, redact: true)
    field(:refresh_token, :string, redact: true)

    field(:avatar_url, :string, virtual: true)
    field(:url, :string, virtual: true)

    timestamps()
  end

  def default_assoc(), do: []

  def providers(), do: @providers

  def provider(type) when type in @provider_types, do: {:ok, providers()[type]}
  def provider(_), do: {:error, :provider_not_found}

  def provider_name(type) when type in @provider_types, do: {:ok, @provider_labels[type]}
  def provider_name(_), do: {:error, :provider_not_found}

  def provider_name!(type) do
    case provider_name(type) do
      {:ok, provider_name} -> provider_name
      {:error, reason} -> raise reason
    end
  end

  def provider!(type) do
    case provider(type) do
      {:ok, provider} -> provider
      {:error, reason} -> raise reason
    end
  end

  def changeset(connection, attrs) do
    connection
    |> cast(attrs, [:uid, :display_name, :avatar, :access_token, :refresh_token])
    |> unsafe_validate_unique([:user_id, :type], Flirtual.Repo)
    |> unique_constraint([:user_id, :type])
  end

  def get(id) when is_binary(id) do
    Connection
    |> where(id: ^id)
    |> Repo.one()
  end

  def get(uid: uid, type: type) when type in @provider_types do
    Connection
    |> where(uid: ^uid, type: ^type)
    |> preload(user: ^User.default_assoc())
    |> Repo.one()
  end

  def get(user_id, type) when is_uid(user_id) and type in @provider_types do
    Connection
    |> where(user_id: ^user_id, type: ^type)
    |> Repo.one()
  end

  def delete(user_id, type) when is_uid(user_id) and type in @provider_types do
    Repo.transaction(fn ->
      case get(user_id, type) do
        nil ->
          :ok

        connection ->
          enqueue_revocation(connection)

          case Repo.delete(connection) do
            {:ok, _} -> :ok
            {:error, reason} -> Repo.rollback(reason)
          end
      end
    end)
    |> case do
      {:ok, :ok} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  # Tell supported providers to invalidate the grant, so the user doesn't see
  # their deleted account on the provider's end and can create a new account
  # with the right flow.
  def revoke(%Connection{type: type} = connection) when type in @provider_types do
    provider!(type).revoke(connection)
  end

  def enqueue_revocation(%Connection{access_token: access_token, refresh_token: refresh_token})
      when not is_binary(access_token) and not is_binary(refresh_token),
      do: :ok

  def enqueue_revocation(%Connection{} = connection) do
    %{
      "type" => to_string(connection.type),
      "access_token" => connection.access_token,
      "refresh_token" => connection.refresh_token
    }
    |> Flirtual.ObanWorkers.RevokeConnection.new()
    |> Oban.insert()

    :ok
  end

  def list_available(%User{connections: []}), do: @provider_types

  def list_available(%User{connections: connections}) do
    @provider_types
    |> Enum.reject(fn type ->
      Enum.any?(connections, fn connection -> connection.type == type end)
    end)
  end

  defimpl Jason.Encoder do
    use Flirtual.Encoder,
      only: [
        :uid,
        :type,
        :display_name,
        :avatar_url,
        :url,
        :updated_at
      ]
  end
end

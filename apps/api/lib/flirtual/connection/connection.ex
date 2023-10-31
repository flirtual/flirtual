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

  schema "connections" do
    belongs_to(:user, User)

    field(:type, Ecto.Enum, values: @provider_types)
    field(:uid, :string)

    field(:display_name, :string)
    field(:avatar, :string)

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
    |> cast(attrs, [:uid, :display_name, :avatar])
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
    case Connection |> where(user_id: ^user_id, type: ^type) |> Repo.delete_all() do
      {_, nil} -> :ok
      {:error, reason} -> {:error, reason}
      reason -> reason
    end
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

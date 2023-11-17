defmodule Flirtual.User.Passkey do
  use Flirtual.Schema
  use Flirtual.Policy.Target, policy: Flirtual.User.Passkey.Policy

  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.Repo
  alias Flirtual.User
  alias Flirtual.User.Passkey

  schema "user_passkeys" do
    belongs_to(:user, User)

    field(:credential_id, :binary)
    field(:cose_key, :binary)
    field(:aaguid, Ecto.UUID)

    timestamps(updated_at: false, inserted_at: :created_at)
  end

  def default_assoc(), do: []

  def get(credential_id) when is_binary(credential_id) do
    Passkey |> where(credential_id: ^credential_id) |> Repo.one()
  end

  def create(user_id, credential_id, cose_key, aaguid) do
    Repo.transaction(fn ->
      with {:ok, item} <-
             %Passkey{}
             |> change(%{
               user_id: user_id,
               credential_id: credential_id,
               cose_key: :erlang.term_to_binary(cose_key),
               aaguid: aaguid
             })
             |> Repo.insert() do
        item
      else
        {:error, reason} -> Repo.rollback(reason)
        reason -> Repo.rollback(reason)
      end
    end)
  end

  def delete(user_id, passkey_id) when is_binary(user_id) and is_binary(passkey_id) do
    case Passkey |> where(user_id: ^user_id, id: ^passkey_id) |> Repo.delete_all() do
      {_, nil} -> :ok
      {:error, reason} -> {:error, reason}
      reason -> reason
    end
  end

  defimpl Jason.Encoder do
    use Flirtual.Encoder,
      only: [
        :id,
        :aaguid,
        :created_at
      ]
  end
end

defmodule Flirtual.User.Passkey.Policy do
  use Flirtual.Policy

  alias Flirtual.User.Passkey

  def authorize(
        :read,
        %Plug.Conn{
          assigns: %{
            session: %{
              user_id: user_id
            }
          }
        },
        %Passkey{
          user_id: user_id
        }
      ) do
    true
  end

  def authorize(_, _, _), do: false

  @own_property_keys [
    :aaguid,
    :created_at
  ]

  def transform(
        key,
        %Plug.Conn{
          assigns: %{
            session: %{
              user_id: user_id
            }
          }
        },
        %Passkey{
          user_id: user_id
        } = passkey
      )
      when key in @own_property_keys,
      do: passkey[key]

  def transform(key, _, _) when key in @own_property_keys, do: nil
end

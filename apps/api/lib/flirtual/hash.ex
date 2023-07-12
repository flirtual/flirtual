defmodule Flirtual.Hash do
  use Flirtual.Schema

  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.{Hash, Repo, User, Users}

  schema "hashes" do
    belongs_to(:user, User)

    field(:type, :string)
    field(:hash, :string)

    timestamps(inserted_at: false)
  end

  def changeset(hash, attrs) do
    hash
    |> cast(attrs, [:user_id, :type, :hash])
    |> validate_required([:type, :hash])
    |> unique_constraint([:user_id, :type, :hash])
  end

  defp hash(type, text) when is_binary(type) and is_binary(text) do
    text = String.downcase(text)

    # normalize gmail/microsoft aliases
    case type do
      "email" ->
        parts = String.split(text, "@")
        [local, domain] = parts

        normalized_local =
          if String.contains?(domain, ["gmail", "hotmail", "outlook", "live"]) do
            local
            |> String.replace(".", "")
            |> String.replace(~r/\+.*/, "")
          else
            local
          end

        normalized_local <> "@" <> domain

      _ ->
        text
    end
    |> (&:crypto.hash(:sha256, &1)).()
    |> Base.encode16(case: :lower)
  end

  def create(attrs) do
    %Hash{}
    |> Hash.changeset(attrs)
    |> Repo.insert()
  end

  def delete(user_id: user_id) when is_binary(user_id) do
    Hash |> where(user_id: ^user_id) |> Repo.delete_all()
  end

  def get(type, hash) when is_binary(type) and is_binary(hash) do
    Hash
    |> where(type: ^type, hash: ^hash)
    |> Repo.all()
  end

  def check_hash(_, _, ""), do: :ok

  def check_hash(user_id, type, text) when is_binary(type) and is_binary(text) do
    hashed = hash(type, text)

    {self, duplicates} =
      get(type, hashed) |> Enum.split_with(fn %{user_id: id} -> id == user_id end)

    if self == [], do: create(%{user_id: user_id, type: type, hash: hashed})

    case duplicates do
      [] ->
        :ok

      _ ->
        duplicates =
          duplicates
          |> Enum.filter(fn user -> not is_nil(user.user_id) end)
          |> Enum.map_join(", ", fn user -> "https://flirtu.al/#{user.user_id}" end)

        Flirtual.Discord.deliver_webhook(:flagged_duplicate,
          user: Users.get(user_id),
          duplicates: duplicates,
          type: type,
          text: text
        )

        :ok
    end
  end
end

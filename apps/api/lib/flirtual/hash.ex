defmodule Flirtual.Hash do
  use Flirtual.Schema

  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.{Discord, Hash, Repo, User, Users}

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

  def delete(user_id) when is_binary(user_id) do
    case Hash |> where(user_id: ^user_id) |> Repo.delete_all() do
      {_, nil} -> :ok
      {:error, reason} -> {:error, reason}
      reason -> reason
    end
  end

  def get(type, hash) when is_binary(type) and is_binary(hash) do
    Hash
    |> where(type: ^type, hash: ^hash)
    |> Repo.all()
  end

  defp anonymize_ip(ip_address) when is_binary(ip_address) do
    case String.split(ip_address, ".") do
      [_oct1, _oct2, oct3, oct4] -> "xxx.xxx.#{oct3}.#{oct4}"
      _ -> ip_address
    end
  end

  def check_hash(_, _, nil), do: :ok

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

        Discord.deliver_webhook(:flagged_duplicate,
          user: Users.get(user_id),
          duplicates: if(duplicates == "", do: "Banned user", else: duplicates),
          type: type,
          text: if(type == "IP address", do: anonymize_ip(text), else: text)
        )

        :ok
    end
  end
end

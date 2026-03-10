defmodule Flirtual.Hash do
  use Flirtual.Schema

  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.{Discord, Hash, IpAddress, Repo, User, Users}

  schema "hashes" do
    belongs_to(:user, User)

    field(:type, :string)
    field(:hash, :string)
    field(:suspended_url, :string)

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

  def add_suspended_url(user_id, url) when is_binary(user_id) and is_binary(url) do
    Hash
    |> where(user_id: ^user_id)
    |> Repo.update_all(set: [suspended_url: url])

    :ok
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

  def check_hash(_, _, nil), do: :ok

  def check_hash(_, _, ""), do: :ok

  def check_hash(user_id, type, text) when is_binary(type) and is_binary(text) do
    hashed = hash(type, if(type == "IP address", do: IpAddress.normalize(text), else: text))

    {self, duplicates} =
      get(type, hashed) |> Enum.split_with(fn %{user_id: id} -> id == user_id end)

    if self == [], do: create(%{user_id: user_id, type: type, hash: hashed})

    case duplicates do
      [] ->
        :ok

      _ ->
        duplicates =
          duplicates
          |> Enum.map(fn
            %{user_id: id} when not is_nil(id) ->
              url = Application.fetch_env!(:flirtual, :frontend_origin) |> URI.merge("/#{id}")
              "[#{id}](#{url})"

            %{suspended_url: url} when not is_nil(url) ->
              "[Banned user](#{url})"

            _ ->
              "Banned user"
          end)
          |> Enum.join(", ")

        Discord.deliver_webhook(:flagged_duplicate,
          user: Users.get(user_id),
          duplicates: duplicates,
          type: type,
          text: if(type == "IP address", do: IpAddress.anonymize(text), else: text)
        )

        :ok
    end
  end
end

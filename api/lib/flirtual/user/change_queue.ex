defmodule Flirtual.User.ChangeQueue do
  use Flirtual.Schema

  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.Talkjs
  alias Flirtual.Elasticsearch
  alias Flirtual.Repo
  alias Flirtual.User
  alias Flirtual.User.ChangeQueue

  schema "dirty_users_queue" do
    belongs_to :user, User
    timestamps(inserted_at: :created_at)
  end

  def add(%User{} = user), do: add(user.id)

  def add(user_id) when is_binary(user_id) do
    log(:info, ["add"], user_id)

    Repo.transaction(fn ->
      item =
        ChangeQueue
        |> where(user_id: ^user_id)
        |> Repo.one()

      if not is_nil(item) do
        item
      else
        with {:ok, item} <-
               %ChangeQueue{}
               |> change(%{user_id: user_id})
               |> Repo.insert_or_update() do
          item
        else
          {:error, reason} -> Repo.rollback(reason)
          reason -> Repo.rollback(reason)
        end
      end
    end)
  end

  def remove(user_id) when is_binary(user_id) do
    log(:info, ["remove"], user_id)

    with {_, nil} <-
           from(ChangeQueue, where: [user_id: ^user_id]) |> Repo.delete_all() do
      :ok
    else
      _ -> :error
    end
  end

  def remove([]), do: :ok

  def remove(user_ids) when is_list(user_ids) do
    log(:info, ["remove"], user_ids)

    with {_, nil} <-
           from(item in ChangeQueue, where: item.user_id in ^user_ids) |> Repo.delete_all() do
      :ok
    else
      _ -> :error
    end
  end

  def fetch(limit) do
    from(item in ChangeQueue,
      limit: ^limit,
      order_by: [asc: :created_at],
      join: user in assoc(item, :user),
      preload: [user: ^User.default_assoc()]
    )
    |> Repo.all()
  end

  def next(limit \\ 10) do
    Repo.transaction(fn ->
      items = fetch(limit)

      if length(items) === 0 do
        0
      else
        with :ok <- process_items(items, :talkjs),
             :ok <- process_items(items, :elasticsearch),
             :ok <-
               items
               |> Enum.map(& &1.user_id)
               |> remove() do
          length(items)
        else
          {:error, reason} -> Repo.rollback(reason)
          reason -> Repo.rollback(reason)
        end
      end
    end)
  end

  defp process_items(items, :talkjs) do
    Enum.map(items, &Talkjs.update_user(&1.user))
    |> Enum.reduce(:ok, fn item, _ ->
      case item do
        {:error, _} -> item
        {:ok, _} -> :ok
      end
    end)
  end

  defp process_items(items, :elasticsearch) do
    Elasticsearch.bulk(
      "users",
      Enum.map(items, fn item ->
        document_id = item.user.id
        document = Elasticsearch.encode(item.user)

        type =
          if(User.visible?(item.user),
            do:
              if Elasticsearch.exists?("users", document_id) do
                :update
              else
                :create
              end,
            else: :delete
          )

        document = if(type !== :delete, do: document, else: nil)

        {
          type,
          document_id,
          document
        }
      end)
    )
  end
end

defmodule Flirtual.User.ChangeQueue do
  use Flirtual.Schema, primary_key: false
  use Flirtual.Logger, :changequeue

  require Flirtual.Utilities
  import Flirtual.Utilities

  import Ecto.Changeset
  import Ecto.Query

  alias Flirtual.Talkjs
  alias Flirtual.Elasticsearch
  alias Flirtual.Repo
  alias Flirtual.User
  alias Flirtual.User.ChangeQueue

  schema "user_change_queue" do
    belongs_to(:user, User, primary_key: true)
    timestamps(updated_at: false)
  end

  def get(user_id) when is_uid(user_id) do
    log(:debug, ["get"], user_id)

    ChangeQueue |> where(user_id: ^user_id) |> Repo.one()
  end

  def get(_), do: nil

  def add(%User{} = user), do: add(user.id)

  def add(user_id) when is_uid(user_id) do
    log(:debug, ["add"], user_id)

    case get(user_id) do
      nil -> %ChangeQueue{}
      item -> item
    end
    |> change(%{user_id: user_id})
    |> unique_constraint(:user_id, name: :user_change_queue_pkey)
    |> Repo.insert_or_update(on_conflict: :nothing)
  end

  def add([]), do: {:ok, 0}

  def add(user_ids) when is_list(user_ids) do
    log(:debug, ["add"], user_ids)

    {count, nil} =
      Repo.insert_all(
        ChangeQueue,
        user_ids
        |> Enum.map(
          &%{
            user_id: &1,
            created_at: {:placeholder, :now}
          }
        ),
        on_conflict: :nothing,
        placeholders: %{
          now: DateTime.truncate(DateTime.utc_now(), :second)
        }
      )

    {:ok, count}
  end

  def remove(user_id) when is_uid(user_id) do
    log(:debug, ["remove"], user_id)

    with {_, nil} <-
           from(ChangeQueue, where: [user_id: ^user_id]) |> Repo.delete_all() do
      :ok
    else
      _ -> :error
    end
  end

  def remove([]), do: :ok

  def remove(user_ids) when is_list(user_ids) do
    log(:debug, ["remove"], user_ids)

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
    |> Enum.map(fn item ->
      %{
        item
        | user: %User{
            item.user
            | visible: User.visible?(item.user)
          }
      }
    end)
  end

  def next(limit \\ 1000) do
    items = fetch(limit)

    with :ok <- process_items(items, :elasticsearch),
         :ok <- process_items(items, :talkjs),
         :ok <-
           items
           |> Enum.map(& &1.user_id)
           |> remove() do
      {:ok, length(items)}
    else
      {:error, reason} -> {:error, reason}
      reason -> {:error, reason}
    end
  end

  defp process_items([], _), do: :ok

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
    documents = Elasticsearch.get(:users, Enum.map(items, & &1.user_id))

    items
    |> Enum.group_by(& &1.user.visible)
    |> Map.to_list()
    |> Enum.each(fn {visible, items} ->
      {_, nil} =
        User
        |> where([user], user.id in ^Enum.map(items, & &1.user_id))
        |> Repo.update_all(set: [visible: visible])
    end)

    Elasticsearch.bulk(
      :users,
      Enum.map(items, fn item ->
        document_id = item.user_id

        document = Elasticsearch.encode(item.user)
        document_exists? = not is_nil(Enum.find(documents, &(&1["id"] === document_id)))

        type =
          if(item.user.visible,
            do: if(document_exists?, do: :update, else: :create),
            else: :delete
          )

        {
          type,
          document_id,
          if(type !== :delete, do: document, else: nil)
        }
      end)
    )
  end
end

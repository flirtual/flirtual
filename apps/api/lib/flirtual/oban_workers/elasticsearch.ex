defmodule Flirtual.ObanWorkers.Elasticsearch do
  use Oban.Worker, unique: [period: :infinity, states: [:available, :scheduled]]

  import Ecto.Query

  alias Flirtual.{Elasticsearch, Repo, User}
  alias Flirtual.User.Profile.Prospect

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id}}) do
    process_users([user_id])
  end

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_ids" => user_ids}}) do
    process_users(user_ids)
  end

  def process_users(user_ids) do
    documents = Elasticsearch.get(:users, user_ids)

    users =
      User
      |> where([user], user.id in ^user_ids)
      |> preload(^User.default_assoc())
      |> Repo.all()

    users
    |> Enum.each(fn user ->
      visible = User.visible?(user)

      User
      |> where(id: ^user.id)
      |> Repo.update_all(set: [visible: visible])

      if not visible do
        Prospect
        |> where([prospect], prospect.target_id == ^user.id)
        |> Repo.delete_all()
      end
    end)

    Elasticsearch.bulk(
      :users,
      Enum.map(users, fn user ->
        document_id = user.id
        document = Elasticsearch.encode(user)
        document_exists? = not is_nil(Enum.find(documents, &(&1["id"] === document_id)))

        type =
          if(user.visible,
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
